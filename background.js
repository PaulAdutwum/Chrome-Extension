chrome.runtime.onInstalled.addListener(() => {
    console.log(" AI Accessibility Extension Installed!");
    chrome.storage.local.set({ OPENAI_API_KEY: "your-api-key-here" });
});


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Message received in background.js:", message);

    
    if (message.action === "toggleSidebar") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs.length || !tabs[0].id || !tabs[0].url.startsWith("http")) {
                console.warn("⚠️ No valid tab found or page is restricted.");
                return;
            }

            console.log("🛠 Injecting content script...");

            
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                files: ["content.js"]
            }).then(() => {
                console.log(" Content script injected successfully.");

                
                setTimeout(() => {
                    chrome.tabs.sendMessage(tabs[0].id, { action: "showToolbar" })
                    .catch(error => console.warn("⚠️ Could not send message to content script:", error));
                }, 500);
            }).catch(err => console.error("Failed to inject content script:", err));
        });
    }

    // Handle AI API Calls from content.js
    if (message.action === "fetchAIResponse") {
        console.log("🔍 Processing AI request...");

        chrome.storage.local.get("OPENAI_API_KEY", async (data) => {
            const OPENAI_API_KEY = data.OPENAI_API_KEY;
            if (!OPENAI_API_KEY) {
                sendResponse({ error: "API key not found." });
                return;
            }

            try {
                const response = await fetch("https://api.openai.com/v1/completions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${OPENAI_API_KEY}`
                    },
                    body: JSON.stringify({
                        model: "text-davinci-003",
                        prompt: message.prompt,
                        max_tokens: 100
                    })
                });

                const result = await response.json();
                if (result.choices && result.choices.length > 0) {
                    console.log(" AI Response Received.");
                    sendResponse({ response: result.choices[0].text.trim() });
                } else {
                    console.warn("⚠️ No AI-generated response received.");
                    sendResponse({ error: "No AI-generated response received." });
                }
            } catch (error) {
                console.error(" Error fetching AI response:", error);
                sendResponse({ error: "Failed to connect to OpenAI API." });
            }
        });

        return true; 
    }
});