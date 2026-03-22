const btn = document.getElementById("toggleBtn");
const status = document.getElementById("status");

chrome.storage.local.get("inspectorEnabled", ({ inspectorEnabled }) => {
  updateUI(!!inspectorEnabled);
});

btn.addEventListener("click", () => {
  chrome.storage.local.get("inspectorEnabled", ({ inspectorEnabled }) => {
    const next = !inspectorEnabled;
    chrome.storage.local.set({ inspectorEnabled: next });
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "SET_INSPECTOR", enabled: next });
      }
    });
    updateUI(next);
  });
});

function updateUI(enabled) {
  btn.textContent = enabled ? "Disable Inspector" : "Enable Inspector";
  btn.className = enabled ? "on" : "off";
  status.textContent = enabled
    ? "Hover to highlight · click to capture"
    : "Inspector is off";
}
