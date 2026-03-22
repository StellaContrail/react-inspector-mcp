# react-inspector-mcp

A Chrome Extension + MCP Server bridge that lets you click any React component in the browser and instantly share its source location with Claude Code.

Instead of typing "the green button in the server controls panel around line 45", just click it.

![Chrome Extension popup showing Enable Inspector button](https://placeholder)

---

## How it works

```
Browser (Chrome Extension)  →  HTTP POST :7777  →  MCP Server  →  Claude Code
       click component                              stdio transport    get_component_context()
```

1. Enable the inspector from the extension popup
2. Hover over any element — a box-model overlay shows margin / padding / content areas
3. Click to capture — the component's name, file path, and line number are sent to the MCP server
4. Ask Claude Code to make a change — it calls `get_component_context` to know exactly which file to edit

The file path comes from React's `_debugSource`, which is available when running a Vite or Create React App dev server.

---

## Requirements

- Node.js 18+
- Google Chrome
- A React app running in development mode (e.g. `npm run dev` with Vite)

---

## Setup

### 1. Install MCP Server dependencies

```bash
cd mcp-server
npm install
```

### 2. Register with Claude Code

```bash
claude mcp add react-inspector-mcp -- node /absolute/path/to/mcp-server/server.mjs
```

Replace `/absolute/path/to` with the actual path where you cloned this repo.

### 3. Load the Chrome Extension

1. Open `chrome://extensions/`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked**
4. Select the `extension/` directory in this repo

---

## Usage

1. Start your React dev server (`npm run dev`)
2. Click the **React Inspector MCP** icon in Chrome → **Enable Inspector**
3. Hover over the UI — elements are highlighted with a color-coded box-model overlay:
   - 🟠 Orange — margin
   - 🟡 Yellow — border
   - 🟢 Green — padding
   - 🔵 Blue — content
4. Click the component you want to change
5. In Claude Code, describe what you want — Claude will call `get_component_context` automatically

### MCP Tools

| Tool | Description |
|------|-------------|
| `get_component_context` | Returns the last captured component (name, file path, line number, props, DOM info) |
| `wait_for_component_selection` | Blocks until the user clicks a component, then returns its context (with configurable timeout) |

### Example response

```json
{
  "component": {
    "name": "ServerControls",
    "filePath": "/home/user/project/src/components/ServerControls.tsx",
    "lineNumber": 45,
    "columnNumber": 3
  },
  "element": {
    "tagName": "button",
    "classes": ["bg-green-500", "text-white", "px-4", "py-2"],
    "textContent": "Launch Server"
  },
  "props": {
    "apiUrl": "https://..."
  },
  "clickArea": "padding",
  "componentPath": ["App", "ServerControls", "button"],
  "url": "http://localhost:5173/",
  "capturedAt": "2026-03-22T10:30:00Z"
}
```

---

## Project structure

```
react-inspector-mcp/
├── extension/
│   ├── manifest.json       # Manifest V3
│   ├── popup.html/js       # Enable/disable toggle UI
│   ├── content-main.js     # Highlight overlay + React Fiber extraction + POST
│   └── icons/
└── mcp-server/
    ├── package.json
    └── server.mjs          # HTTP receiver (port 7777) + MCP stdio server
```

---

## Notes

- **Dev mode only**: `filePath` and `lineNumber` rely on React's `_debugSource`, which is only present in development builds. The component name is still captured in production.
- **Port 7777**: The HTTP server binds to `127.0.0.1` only and is not accessible externally.
- **Auto-disable**: The inspector turns off automatically after each capture to avoid accidental clicks.
