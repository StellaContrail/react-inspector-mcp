// React Inspector MCP — Content Script
// Highlights React components with a box-model overlay (margin/border/padding/content)
// and POSTs component context to the local MCP server on click.

let inspectorEnabled = false;
let overlayState = null;      // { container, divs }
let currentHoverTarget = null;
let _rafId = null;

// ─── Init ────────────────────────────────────────────────────────────────────

chrome.storage.local.get("inspectorEnabled", ({ inspectorEnabled: enabled }) => {
  if (enabled) activate();
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type !== "SET_INSPECTOR") return;
  if (msg.enabled) activate();
  else deactivate();
});

// ─── Activate / Deactivate ───────────────────────────────────────────────────

function activate() {
  if (inspectorEnabled) return;
  inspectorEnabled = true;
  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseleave", onMouseLeave);
  document.addEventListener("click", onClick, true);
  document.body.style.cursor = "crosshair";
}

function deactivate() {
  if (!inspectorEnabled) return;
  inspectorEnabled = false;
  document.removeEventListener("mousemove", onMouseMove);
  document.removeEventListener("mouseleave", onMouseLeave);
  document.removeEventListener("click", onClick, true);
  document.body.style.cursor = "";
  removeOverlay();
  currentHoverTarget = null;
}

// ─── Box Model ───────────────────────────────────────────────────────────────

function getBoxModel(el) {
  const rect = el.getBoundingClientRect();
  const cs = getComputedStyle(el);
  const isInline = cs.display === "inline";

  const mt = isInline ? 0 : parseFloat(cs.marginTop);
  const mr = parseFloat(cs.marginRight);
  const mb = isInline ? 0 : parseFloat(cs.marginBottom);
  const ml = parseFloat(cs.marginLeft);

  const marginBox = {
    left: rect.left - ml,
    top: rect.top - mt,
    right: rect.right + mr,
    bottom: rect.bottom + mb,
  };
  const borderBox = {
    left: rect.left,
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
  };
  const paddingBox = {
    left: rect.left + parseFloat(cs.borderLeftWidth),
    top: rect.top + parseFloat(cs.borderTopWidth),
    right: rect.right - parseFloat(cs.borderRightWidth),
    bottom: rect.bottom - parseFloat(cs.borderBottomWidth),
  };
  const contentBox = {
    left: paddingBox.left + parseFloat(cs.paddingLeft),
    top: paddingBox.top + parseFloat(cs.paddingTop),
    right: paddingBox.right - parseFloat(cs.paddingRight),
    bottom: paddingBox.bottom - parseFloat(cs.paddingBottom),
  };

  return { marginBox, borderBox, paddingBox, contentBox };
}

function hitArea(box, x, y) {
  return x >= box.left && x <= box.right && y >= box.top && y <= box.bottom;
}

function hitTestArea(el, x, y) {
  const { contentBox, paddingBox, borderBox, marginBox } = getBoxModel(el);
  if (hitArea(contentBox, x, y)) return "content";
  if (hitArea(paddingBox, x, y)) return "padding";
  if (hitArea(borderBox, x, y))  return "border";
  if (hitArea(marginBox, x, y))  return "margin";
  return "content"; // fallback
}

// Walk children to find the deepest element whose margin box contains (x, y).
// This resolves clicks on margin/padding space that otherwise land on the parent.
function findBestElement(x, y, topEl) {
  for (let i = topEl.children.length - 1; i >= 0; i--) {
    const child = topEl.children[i];
    if (hitArea(getBoxModel(child).marginBox, x, y)) {
      return findBestElement(x, y, child);
    }
  }
  return topEl;
}

// ─── Overlay ─────────────────────────────────────────────────────────────────

const LAYER_COLORS = {
  margin:  "rgba(251, 146,  60, 0.45)", // orange
  border:  "rgba(253, 224,  71, 0.45)", // yellow
  padding: "rgba(134, 239, 172, 0.45)", // green
  content: "rgba(147, 197, 253, 0.45)", // blue
};

function createOverlay() {
  const container = document.createElement("div");
  container.style.cssText =
    "position:fixed;pointer-events:none;z-index:2147483647;";

  const divs = {};
  for (const [layer, color] of Object.entries(LAYER_COLORS)) {
    const div = document.createElement("div");
    div.style.cssText = `position:absolute;background:${color};transition:opacity 0.1s;`;
    container.appendChild(div);
    divs[layer] = div;
  }

  // Component name label
  const label = document.createElement("div");
  label.style.cssText =
    "position:absolute;bottom:-22px;left:0;" +
    "background:#1e40af;color:#fff;" +
    "font-size:11px;padding:2px 7px;border-radius:3px;" +
    "white-space:nowrap;font-family:monospace;line-height:18px;";
  container.appendChild(label);
  divs.label = label;

  document.documentElement.appendChild(container);
  return { container, divs };
}

function removeOverlay() {
  if (overlayState) {
    overlayState.container.remove();
    overlayState = null;
  }
}

function showHighlight(el, x, y) {
  if (!overlayState) overlayState = createOverlay();
  const { container, divs } = overlayState;

  const { marginBox, borderBox, paddingBox, contentBox } = getBoxModel(el);
  const activeArea = hitTestArea(el, x, y);

  // Anchor container to border-box
  container.style.left   = `${borderBox.left}px`;
  container.style.top    = `${borderBox.top}px`;
  container.style.width  = `${borderBox.right - borderBox.left}px`;
  container.style.height = `${borderBox.bottom - borderBox.top}px`;

  const boxMap = { margin: marginBox, border: borderBox, padding: paddingBox, content: contentBox };
  for (const [layer, div] of Object.entries(divs)) {
    if (layer === "label") continue;
    const box = boxMap[layer];
    div.style.left   = `${box.left   - borderBox.left}px`;
    div.style.top    = `${box.top    - borderBox.top}px`;
    div.style.width  = `${box.right  - box.left}px`;
    div.style.height = `${box.bottom - box.top}px`;
    div.style.opacity = layer === activeArea ? "1" : "0.3";
  }

  const name = getComponentName(el);
  divs.label.textContent = name ? `${name} · ${activeArea}` : activeArea;
}

// ─── React Fiber ─────────────────────────────────────────────────────────────

function getReactFiber(el) {
  const key = Object.keys(el).find(
    (k) => k.startsWith("__reactFiber") || k.startsWith("__reactInternalInstance")
  );
  return key ? el[key] : null;
}

function getComponentName(el) {
  let node = getReactFiber(el);
  while (node) {
    if (typeof node.type === "function" && node.type.name) return node.type.name;
    node = node.return;
  }
  return null;
}

function extractComponentInfo(el, x, y) {
  let node = getReactFiber(el);
  while (node) {
    if (typeof node.type === "function" && node.type.name) {
      const source = node._debugSource; // { fileName, lineNumber, columnNumber } — dev mode only

      // Serialize props (skip children, functions become "[function]")
      const props = {};
      if (node.pendingProps) {
        for (const [k, v] of Object.entries(node.pendingProps)) {
          if (k === "children") continue;
          if (typeof v === "function") props[k] = "[function]";
          else if (v !== null && typeof v === "object") props[k] = "[object]";
          else props[k] = v;
        }
      }

      // Walk up to build component path (up to 8 ancestors)
      const path = [];
      let walker = node;
      while (walker && path.length < 8) {
        if (typeof walker.type === "function" && walker.type.name) path.unshift(walker.type.name);
        else if (typeof walker.type === "string") path.unshift(walker.type);
        walker = walker.return;
      }

      return {
        component: {
          name: node.type.name,
          filePath: source?.fileName ?? null,
          lineNumber: source?.lineNumber ?? null,
          columnNumber: source?.columnNumber ?? null,
        },
        element: {
          tagName: el.tagName.toLowerCase(),
          id: el.id || "",
          classes: Array.from(el.classList),
          textContent: (el.textContent ?? "").trim().slice(0, 120),
          cssSelector: buildCssSelector(el),
        },
        props,
        clickArea: hitTestArea(el, x, y),
        componentPath: path,
        url: location.href,
        capturedAt: new Date().toISOString(),
      };
    }
    node = node.return;
  }
  return null;
}

function buildCssSelector(el) {
  const parts = [];
  let node = el;
  while (node && node !== document.body && parts.length < 4) {
    let sel = node.tagName.toLowerCase();
    if (node.id) sel += `#${node.id}`;
    else if (node.classList.length) sel += `.${Array.from(node.classList).slice(0, 2).join(".")}`;
    parts.unshift(sel);
    node = node.parentElement;
  }
  return parts.join(" > ");
}

// ─── Event Handlers ──────────────────────────────────────────────────────────

function onMouseMove(e) {
  if (_rafId) return;
  _rafId = requestAnimationFrame(() => {
    _rafId = null;
    const topEl = document.elementFromPoint(e.clientX, e.clientY);
    if (!topEl || topEl === document.documentElement) return;
    currentHoverTarget = findBestElement(e.clientX, e.clientY, topEl);
    showHighlight(currentHoverTarget, e.clientX, e.clientY);
  });
}

function onMouseLeave() {
  removeOverlay();
  currentHoverTarget = null;
}

async function onClick(e) {
  e.preventDefault();
  e.stopPropagation();

  const target = currentHoverTarget || e.target;
  const info = extractComponentInfo(target, e.clientX, e.clientY);

  if (!info) {
    showToast("No React component found at this element", true);
    return;
  }

  try {
    await fetch("http://localhost:7777/component", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(info),
    });
    showToast(`Captured: ${info.component.name} (${info.clickArea})`);
  } catch {
    showToast("MCP Server not running — start it on port 7777", true);
    return;
  }

  // Auto-disable after capture
  deactivate();
  chrome.storage.local.set({ inspectorEnabled: false });
}

// ─── Toast ───────────────────────────────────────────────────────────────────

function showToast(msg, isError = false) {
  const el = document.createElement("div");
  el.textContent = msg;
  el.style.cssText =
    "position:fixed;bottom:20px;right:20px;z-index:2147483647;" +
    `background:${isError ? "#ef4444" : "#1e40af"};color:#fff;` +
    "padding:8px 14px;border-radius:6px;font-size:12px;" +
    "font-family:monospace;box-shadow:0 2px 10px rgba(0,0,0,0.25);" +
    "pointer-events:none;";
  document.documentElement.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}
