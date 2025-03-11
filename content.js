
console.log("✅ Content script loaded and listening for messages...");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("📩 Message received in content script:", message);

    if (message.action === "showToolbar") {
        if (!document.getElementById("accessibility-toolbar")) {
            console.log("🛠 Creating toolbar...");
            createToolbar();
        } else {
            console.log("✅ Toolbar already exists.");
        }
        sendResponse({ status: "success", message: "Toolbar displayed successfully." });
    } else {
        sendResponse({ status: "error", message: "Unknown action received." });
    }
    return true;
});


function createToolbar() {
    let toolbar = document.getElementById("accessibility-toolbar");
    if (!toolbar) {
        console.log("Creating toolbar...");
        toolbar = document.createElement("div");
        toolbar.id = "accessibility-toolbar";
        toolbar.style.position = "fixed";
        toolbar.style.bottom = "10px";
        toolbar.style.right = "10px";  
        toolbar.style.display = "flex";
        toolbar.style.flexDirection = "column";  
        toolbar.style.gap = "15px"; 
        toolbar.style.padding = "15px";
        toolbar.style.background = "#222";
        toolbar.style.color = "#fff";
        toolbar.style.borderRadius = "10px";
        toolbar.style.zIndex = "10000";
        toolbar.style.boxShadow = "0px 4px 10px rgba(0, 0, 0, 0.3)";
        toolbar.style.cursor = "pointer";  

        toolbar.innerHTML = `
            <div>
                <label for="contrast-slider">Contrast: <span id="contrast-value">100%</span></label>
                <input type="range" id="contrast-slider" min="50" max="200" value="100">
            </div>
            <div>
                <label for="brightness-slider">Brightness: <span id="brightness-value">100%</span></label>
                <input type="range" id="brightness-slider" min="50" max="200" value="100">
            </div>
            <div>
                <label for="text-size-slider">Text Size: <span id="text-size-value">16px</span></label>
                <input type="range" id="text-size-slider" min="12" max="32" value="16">
            </div>
            <button id="colorblind-mode"> Colorblind Mode</button>
            <button id="epilepsy-mode">⚡ Epilepsy Mode</button>
            <button id="screen-reader-btn">🗣️ Screen Reader</button>
            <button id="voice-nav-btn">🎙️ Voice Navigation</button>
            <button id="ai-form-fill">✍️ AI Form Fill</button>
           <div id="chat-container">
                <input type="text" id="chat-input" placeholder="Ask AI..." />
                <button id="mic-btn">🎤</button>
                <button id="chat-ai"> Chat AI</button>
            </div>
            <button id="close-toolbar"> Close</button>
        `;
        document.body.appendChild(toolbar);
        

        
        document.querySelectorAll("#contrast-slider, #brightness-slider, #text-size-slider").forEach((slider) => {
            slider.addEventListener("input", () => clearTimeout(window.toolbarTimeout));
        });

       
        toolbar.addEventListener("mouseleave", (event) => {
            if (!event.relatedTarget || !event.relatedTarget.closest("#accessibility-toolbar")) {
                window.toolbarTimeout = setTimeout(() => {
                    toolbar.style.display = "none";  
                }, 5000);
            }
        });

       
        document.getElementById("contrast-slider").addEventListener("input", (e) => {
            const contrastValue = e.target.value;
            document.getElementById("contrast-value").innerText = `${contrastValue}%`;
            document.body.style.filter = `contrast(${contrastValue}%) brightness(${document.getElementById("brightness-slider").value}%)`;
        });
        
        document.getElementById("brightness-slider").addEventListener("input", (e) => {
            const brightnessValue = e.target.value;
            document.getElementById("brightness-value").innerText = `${brightnessValue}%`;
            document.body.style.filter = `brightness(${brightnessValue}%) contrast(${document.getElementById("contrast-slider").value}%)`;
        });
        
        document.getElementById("text-size-slider").addEventListener("input", (e) => {
            const textSizeValue = e.target.value;
            document.getElementById("text-size-value").innerText = `${textSizeValue}px`;
        
           
            document.querySelectorAll("p, span, div, h1, h2, h3, h4, h5, h6, a, button, input, textarea, label").forEach(el => {
                el.style.fontSize = `${textSizeValue}px`;
            });
        });

        document.getElementById("colorblind-mode").addEventListener("click", toggleColorblindMode);
        document.getElementById("epilepsy-mode").addEventListener("click", toggleEpilepsyMode);
        document.getElementById("screen-reader-btn").addEventListener("click", toggleScreenReader);
        document.getElementById("voice-nav-btn").addEventListener("click", activateVoiceNavigation);
        document.getElementById("ai-form-fill").addEventListener("click", activateAIFill);
        document.getElementById("chat-ai").addEventListener("click", handleChat);
        document.getElementById("mic-btn").addEventListener("click", startVoiceInput);
        document.getElementById("close-toolbar").addEventListener("click", () => toolbar.remove());
    }
}

function showAIFormFillPopup() {
    let popup = document.getElementById("ai-form-popup");
    if (!popup) {
        popup = document.createElement("div");
        popup.id = "ai-form-popup";
        popup.style.position = "fixed";
        popup.style.bottom = "50px";
        popup.style.right = "20px";
        popup.style.width = "300px";
        popup.style.padding = "15px";
        popup.style.background = "#333";
        popup.style.color = "white";
        popup.style.borderRadius = "10px";
        popup.style.boxShadow = "0px 4px 10px rgba(0, 0, 0, 0.3)";
        popup.style.zIndex = "10000";
        popup.innerHTML = `
            <h3>AI Form Fill</h3>
            <p>Do you want AI to fill out form fields?</p>
            <button id="ai-fill-yes" style="margin-right:10px;">Yes</button>
            <button id="ai-fill-no">No</button>
        `;

        document.body.appendChild(popup);

        document.getElementById("ai-fill-yes").addEventListener("click", () => {
            activateAIFill();
            popup.remove();
        });

        document.getElementById("ai-fill-no").addEventListener("click", () => {
            popup.remove();
        });
    }
}



["epilepsyModeActive", "colorblindModeActive"].forEach(mode => {
    if (typeof window[mode] === "undefined") {
        window[mode] = false;
    }
});


function toggleColorblindMode() {
    window.colorblindModeActive = !window.colorblindModeActive;
    document.documentElement.style.filter = window.colorblindModeActive ? "grayscale(80%) contrast(110%)" : "";
    document.body.style.backgroundColor = window.colorblindModeActive ? "#EFEFEF" : "";
    console.log(`Colorblind mode ${window.colorblindModeActive ? "activated" : "deactivated"}.`);
}


function toggleEpilepsyMode() {
    window.epilepsyModeActive = !window.epilepsyModeActive;

    if (window.epilepsyModeActive) {
        document.body.style.filter = "brightness(90%) contrast(90%)"; 
        document.documentElement.style.scrollBehavior = "auto"; 
        document.body.style.transition = "none"; 
        document.querySelectorAll("*").forEach(el => {
            el.style.animation = "none";  
            el.style.transition = "none";
        });

        
        document.body.style.backgroundColor = "#f0f0f0"; 
        document.body.style.color = "#222"; 

        console.log("Epilepsy mode activated: All animations disabled, contrast reduced.");
    } else {
       
        document.body.style.filter = "";
        document.documentElement.style.scrollBehavior = "smooth";
        document.body.style.transition = "";
        document.querySelectorAll("*").forEach(el => {
            el.style.animation = "";
            el.style.transition = "";
        });

        document.body.style.backgroundColor = ""; 
        document.body.style.color = ""; 

        console.log(" Epilepsy mode deactivated: Restored default settings.");
    }
}



if (typeof window.voiceActive === "undefined") {
    window.voiceActive = false;
}

function activateVoiceNavigation() {
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
        console.error("⚠️ Speech Recognition not supported in this browser.");
        alert("Your browser does not support voice recognition.");
        return;
    }

    if (window.voiceActive) {
        console.log("🎙️ Voice navigation stopped.");
        speakText("Voice navigation stopped.");
        window.voiceActive = false;
        return;
    }

    console.log("🎙️ Voice navigation started.");
    window.voiceActive = true;

    speakText("Voice navigation activated. Say 'Next' to move forward, 'Back' to move backward, 'Enter' to open an item, 'Stop' to disable voice navigation.");

    try {
        const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.lang = "en-US";
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.start();

        let focusableElements = Array.from(document.querySelectorAll('a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])'));
        let currentIndex = -1;

        function moveToElement(index) {
            if (index >= 0 && index < focusableElements.length) {
                currentIndex = index;
                focusableElements[currentIndex].focus();
                speakText(`Selected ${focusableElements[currentIndex].innerText || "item"}.`);
            } else {
                speakText("No more items.");
            }
        }

        recognition.onresult = (event) => {
            const command = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
            console.log("🎙️ Voice command received:", command);

            if (command.includes("next")) {
                moveToElement(currentIndex + 1);
            } else if (command.includes("back")) {
                moveToElement(currentIndex - 1);
            } else if (command.includes("enter")) {
                focusableElements[currentIndex]?.click();
                speakText("Opening item.");
            } else if (command.includes("read")) {
                speakText(focusableElements[currentIndex]?.innerText || "No readable text.");
            } else if (command.includes("stop") || command.includes("close")) {
                recognition.stop();
                window.voiceActive = false;
                speakText("Voice navigation stopped.");
            }
        };

        recognition.onerror = (event) => {
            console.error("⚠️ Voice recognition error:", event);
            if (event.error === "not-allowed") {
                alert("Microphone access denied. Please enable microphone permissions.");
            } else if (event.error === "network") {
                alert("Network error. Please check your connection.");
            } else {
                speakText("An error occurred with voice recognition.");
            }
            window.voiceActive = false;
        };

        recognition.onend = () => {
            console.log("🎙️ Voice recognition stopped.");
            if (window.voiceActive) {
                setTimeout(() => {
                    console.log("🔄 Restarting voice recognition...");
                    recognition.start();
                }, 1000);
            }
        };

    } catch (error) {
        console.error("⚠️ Speech Recognition Error:", error);
        alert("Voice navigation is not supported in this browser.");
        window.voiceActive = false;
    }
}

   

// Function to speak text aloud
function speakText(text) {
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "en-US";
    speech.rate = 1.0;
    speech.pitch = 1.0;
    window.speechSynthesis.speak(speech);
}

  
    
// Screen Reader
if (typeof window.screenReaderActive === "undefined") {
    window.screenReaderActive = false;
}

function toggleScreenReader() {
    if (window.screenReaderActive) {
        window.speechSynthesis.cancel();
        window.screenReaderActive = false;
        console.log("Screen reader stopped.");
    } else {
        const speech = new SpeechSynthesisUtterance(document.body.innerText);
        speech.lang = "en-US";
        speech.onend = () => { window.screenReaderActive = false; };
        window.speechSynthesis.speak(speech);
        window.screenReaderActive = true;
        console.log("Screen reader activated.");
    }
}

function handleChat() {
    const userMessage = document.getElementById("chat-input").value.trim();
    if (!userMessage) return;

    chrome.runtime.sendMessage(
        { action: "fetchAIResponse", prompt: userMessage },
        (response) => {
            if (chrome.runtime.lastError) {
                alert("Extension Error: Could not communicate with background script.");
                return;
            }

            if (response.error) {
                alert("AI Error: " + response.error);
            } else {
                showChatResponse(response.response);
                speakResponse(response.response); // Optional: Speak response
            }
        }
    );
}


function startVoiceInput() {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = "en-US";
    recognition.start();

    recognition.onresult = (event) => {
        const userMessage = event.results[0][0].transcript.toLowerCase();
        console.log("User asked:", userMessage);
        document.getElementById("chat-input").value = userMessage; // Autofill input box
        handleChat(); // Auto-send the voice message
    };

    recognition.onerror = (error) => {
        console.error("Voice Recognition Error:", error);
        alert("Could not recognize voice. Try again.");
    };
}



// AI Chat
function openAIChat() {
    // Use voice input for user queries
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = "en-US";
    recognition.start();

    recognition.onresult = (event) => {
        const userMessage = event.results[0][0].transcript.toLowerCase();
        console.log("User asked:", userMessage);

        // Extract webpage content for AI context
        const pageContent = document.body.innerText.slice(0, 2000); // Limit text to prevent long requests

        chrome.runtime.sendMessage(
            {
                action: "fetchAIResponse",
                prompt: `User asks: "${userMessage}". Use this page content for context:\n${pageContent}`
            },
            (response) => {
                if (chrome.runtime.lastError) {
                    alert("Extension Error: Could not communicate with background script.");
                    return;
                }

                if (response.error) {
                    alert("AI Error: " + response.error);
                } else if (!response.response || response.response.trim() === "") {
                    // Fallback response if AI does not generate anything
                    showChatResponse("I couldn't generate a response. Try rephrasing your question.");
                } else {
                    showChatResponse(response.response);
                    speakResponse(response.response); // Speak the response
                }
            }
        );
    };

    recognition.onerror = (error) => {
        console.error("Voice Recognition Error:", error);
    };
}



function showChatResponse(responseText) {
    let chatbox = document.getElementById("ai-chatbox");
    if (!chatbox) {
        chatbox = document.createElement("div");
        chatbox.id = "ai-chatbox";
        chatbox.style.position = "fixed";
        chatbox.style.bottom = "80px";
        chatbox.style.right = "10px";
        chatbox.style.width = "250px";
        chatbox.style.padding = "10px";
        chatbox.style.background = "#333";
        chatbox.style.color = "white";
        chatbox.style.borderRadius = "10px";
        chatbox.style.boxShadow = "0px 4px 10px rgba(0, 0, 0, 0.3)";
        chatbox.style.zIndex = "10000";
        chatbox.innerHTML = `<strong>AI:</strong> <p id="chat-response"></p>`;

        const closeBtn = document.createElement("button");
        closeBtn.innerText = "❌";
        closeBtn.style.position = "absolute";
        closeBtn.style.top = "5px";
        closeBtn.style.right = "5px";
        closeBtn.style.border = "none";
        closeBtn.style.background = "red";
        closeBtn.style.color = "white";
        closeBtn.style.padding = "5px";
        closeBtn.style.cursor = "pointer";
        closeBtn.addEventListener("click", () => chatbox.remove());

        chatbox.appendChild(closeBtn);
        document.body.appendChild(chatbox);
    }

    document.getElementById("chat-response").innerText = responseText;
}

// AI to speak out to users 

function speakResponse(responseText) {
    const speech = new SpeechSynthesisUtterance(responseText);
    speech.lang = "en-US";
    speech.rate = 1.0; // Normal speaking speed
    speech.pitch = 1.0; // Default pitch
    window.speechSynthesis.speak(speech);
}


// AI-Powered Form Filling
function activateAIFill() {
    console.log("✍️ AI Form Fill Activated");
    
    const formFields = document.querySelectorAll("input, textarea, select");
    if (formFields.length === 0) {
        alert("No form fields found on this page.");
        return;
    }

    // Ask user for confirmation before filling forms
    if (!confirm("Do you want AI to automatically fill the form fields?")) return;

    chrome.storage.local.get("OPENAI_API_KEY", async (data) => {
        const OPENAI_API_KEY = data.OPENAI_API_KEY;
        if (!OPENAI_API_KEY) {
            alert("AI key not found.");
            return;
        }

        for (const field of formFields) {
            const fieldName = field.name || field.placeholder || field.id || "Unknown Field";

            try {
                const response = await fetch("https://api.openai.com/v1/completions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${OPENAI_API_KEY}`
                    },
                    body: JSON.stringify({
                        model: "text-davinci-003",
                        prompt: `Provide a realistic value for a form field labeled: ${fieldName}`,
                        max_tokens: 50
                    })
                });

                const data = await response.json();
                if (data.choices && data.choices.length > 0) {
                    field.value = data.choices[0].text.trim();
                    console.log(`Filled: ${fieldName} -> ${field.value}`);
                } else {
                    console.warn(`No AI response for field: ${fieldName}`);
                }
            } catch (error) {
                console.error("AI Form Filling Error:", error);
            }
        }
    });

}

function updatePageContext() {
    chrome.runtime.sendMessage({
        action: "updatePageContext",
        pageTitle: document.title,
        url: window.location.href,
        pageContent: document.body.innerText.slice(0, 1000)  // Limit to 1000 characters
    }, (response) => {
        if (chrome.runtime.lastError) {
            console.warn("⚠️ Could not send page context update:", chrome.runtime.lastError.message);
        } else {
            console.log("📩 Page context updated:", response);
        }
    });
}

// Run on load
updatePageContext();

// Check if observer exists to avoid duplicate instances
if (!window.hasOwnProperty("pageObserver")) {
    window.pageObserver = new MutationObserver(() => {
        updatePageContext();
    });

    // Observe changes in the DOM for SPAs or dynamic pages
    window.pageObserver.observe(document.body, { childList: true, subtree: true });
    console.log("👀 Page observer initialized.");
}

// Listen for speech messages
chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "speakText") {
        const speech = new SpeechSynthesisUtterance(message.text);
        speech.lang = "en-US";
        speech.rate = 1.0;
        speech.pitch = 1.0;
        window.speechSynthesis.speak(speech);

        // Scroll to the last spoken element
        let activeElement = document.activeElement;
        if (activeElement) {
            activeElement.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }
});