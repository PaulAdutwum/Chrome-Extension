document.getElementById("openToolbar").addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "toggleSidebar" });
});