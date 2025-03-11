document.getElementById("openToolbar").addEventListener("click", () => {
    // First, ensure content.js is loaded
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs.length || !tabs[0].id) {
            console.warn("⚠️ No active tab found.");
            return;
        }

        const tabId = tabs[0].id;

        chrome.scripting.executeScript({
            target: { tabId },
            files: ["content.js"]
        }).then(() => {
            console.log("✅ Content script injected successfully.");
            // Now, send the message to show the toolbar
            chrome.tabs.sendMessage(tabId, { action: "showToolbar" });
        }).catch(err => console.error("❌ Failed to inject content script:", err));
    });
});