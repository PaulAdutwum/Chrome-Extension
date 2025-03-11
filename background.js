let currentPageInfo = {
    pageTitle: "Unknown",
    url: "Unknown",
    pageContent: "No content available"
};

// ✅ Store API Key on Installation
chrome.runtime.onInstalled.addListener(() => {
    console.log("🛠️ AI Accessibility Extension Installed!");

    fetch(chrome.runtime.getURL("env.local"))
        .then(response => response.text())
        .then(text => {
            const key = text.match(/OPENAI_API_KEY=(.+)/)?.[1]?.trim();
            if (key) {
                chrome.storage.local.set({ "OPENAI_API_KEY": key });
                console.log("✅ OpenAI API Key Loaded Successfully.");
            } else {
                console.error("❌ OpenAI API Key not found in env.local file.");
            }
        })
        .catch(error => console.error("⚠️ Error loading env.local file:", error));
});

// ✅ Listen for Messages from Content Scripts & Popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("📩 Message received in background.js:", message);

    // ✅ **Update Active Page Context**
    if (message.action === "updatePageContext") {
        currentPageInfo = {
            pageTitle: message.pageTitle || "Unknown",
            url: message.url || "Unknown",
            pageContent: message.pageContent || "No content available"
        };
        console.log("🌍 Updated page context:", currentPageInfo);
        return;
    }

    // ✅ **Process AI Requests**
    if (message.action === "fetchAIResponse") {
        console.log("🔍 Processing AI request...");

        chrome.storage.local.get("OPENAI_API_KEY", async (data) => {
            const OPENAI_API_KEY = data.OPENAI_API_KEY;
            if (!OPENAI_API_KEY) {
                console.error("❌ API key not found.");
                sendResponse({ error: "API key not found. Ensure it's set in env.local" });
                return;
            }

            console.log(`🔑 Using API Key: ${OPENAI_API_KEY.substring(0, 5)}********`);

            try {
                const response = await fetch("https://api.openai.com/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${OPENAI_API_KEY}`
                    },
                    body: JSON.stringify({
                        model: "gpt-4",
                        messages: [
                            { role: "system", content: "You are an AI assistant that helps users navigate websites." },
                            { role: "user", content: `I am currently on the website: "${currentPageInfo.pageTitle}" (${currentPageInfo.url}). 
                                The page contains the following content: "${currentPageInfo.pageContent}". 
                                Now, answer this question based on the website's content: ${message.prompt}` }
                        ],
                        max_tokens: 200,
                        temperature: 0.7
                    })
                });

                if (!response.ok) {
                    console.error(`❌ OpenAI API Error: ${response.status}`);
                    sendResponse({ error: `API Error: ${response.status}` });
                    return;
                }

                const result = await response.json();
                if (result.choices && result.choices.length > 0) {
                    console.log("✅ AI Response Received.");
                    sendResponse({ response: result.choices[0].message.content.trim() });
                } else {
                    sendResponse({ error: "No AI-generated response received." });
                }
            } catch (error) {
                console.error("❌ Error fetching AI response:", error);
                sendResponse({ error: "Failed to connect to OpenAI API." });
            }
        });

        return true;  // Keep the response channel open for async response
    }

    sendResponse({ status: "unhandled_message" });
    return true;
});

// ✅ **Inject Content Script on Valid Webpages**
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs.length || !tabs[0].id) {
        console.warn("⚠️ No active tab found.");
        return;
    }

    const url = tabs[0].url;

    // ✅ Prevent Injection on Restricted Chrome Pages
    if (url.startsWith("chrome://") || url.startsWith("chrome-extension://")) {
        console.warn("⚠️ Cannot inject content script on restricted Chrome pages.");
        return;
    }

    chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        files: ["content.js"]
    }).then(() => {
        console.log("✅ Content script injected successfully.");
    }).catch(err => console.error("❌ Failed to inject content script:", err));
});