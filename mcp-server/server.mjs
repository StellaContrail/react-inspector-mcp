import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "node:http";
import { z } from "zod";

// ─── In-memory store ──────────────────────────────────────────────────────────

let lastComponent = null;
const pendingResolvers = []; // wait_for_component_selection waiters

// ─── HTTP server (port 7777) — receives POST /component from Chrome Extension ─

const httpServer = createServer((req, res) => {
  // CORS for localhost extension requests
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "POST" && req.url === "/component") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const data = JSON.parse(body);
        lastComponent = data;
        // Resolve any waiting MCP tool calls
        while (pendingResolvers.length) {
          pendingResolvers.shift()(data);
        }
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
      } catch {
        res.writeHead(400);
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end();
});

httpServer.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    process.stderr.write(
      "react-inspector-mcp: Port 7777 already in use. Another instance may be running.\n"
    );
    process.exit(1);
  }
  throw err;
});

httpServer.listen(7777, "127.0.0.1", () => {
  process.stderr.write(
    "react-inspector-mcp: HTTP server listening on http://127.0.0.1:7777\n"
  );
});

// ─── MCP Server ───────────────────────────────────────────────────────────────

const server = new McpServer({
  name: "react-inspector-mcp",
  version: "1.0.0",
});

// Tool: get_component_context
server.tool(
  "get_component_context",
  [
    "Returns the last React component selected via the Chrome Extension inspector.",
    "Includes: component name, source file path, line number, props, DOM info, and which box-model area was clicked (margin/border/padding/content).",
    "Returns null if no component has been captured yet.",
  ].join(" "),
  {},
  async () => {
    if (!lastComponent) {
      return {
        content: [
          {
            type: "text",
            text: [
              "No component has been captured yet.",
              "Steps:",
              "1. Enable the React Inspector MCP extension in Chrome",
              "2. Open your React app (e.g. http://localhost:5173)",
              "3. Click the component you want to inspect",
            ].join("\n"),
          },
        ],
      };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(lastComponent, null, 2) }],
    };
  }
);

// Tool: wait_for_component_selection
server.tool(
  "wait_for_component_selection",
  [
    "Waits for the user to click a React component in the Chrome Extension inspector.",
    "Blocks until a new selection arrives or the timeout elapses.",
    "Use this to interactively prompt the user: tell them to click a component, then call this tool.",
  ].join(" "),
  {
    timeout_seconds: z
      .number()
      .optional()
      .default(30)
      .describe("Seconds to wait before timing out (default: 30)"),
  },
  async ({ timeout_seconds }) => {
    const ms = (timeout_seconds ?? 30) * 1000;

    const result = await Promise.race([
      new Promise((resolve) => {
        pendingResolvers.push(resolve);
      }),
      new Promise((resolve) =>
        setTimeout(() => resolve(null), ms)
      ),
    ]);

    // Clean up resolver if it timed out
    if (!result) {
      const idx = pendingResolvers.indexOf(result);
      if (idx !== -1) pendingResolvers.splice(idx, 1);
      return {
        content: [
          {
            type: "text",
            text: `Timed out after ${timeout_seconds ?? 30}s. No component was selected.`,
          },
        ],
      };
    }

    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

// ─── Connect via stdio ────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
