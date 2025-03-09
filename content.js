console.log("AI Accessibility Extension Loaded");

// Listen for messages from background.js
chrome.runtime.onMessage.addListener((message) => {
    console.log("Message received in content script:", message);
    if (message.action === "showToolbar") {
        createToolbar();
    }
});

// Function to create the accessibility toolbar
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
            <button id="chat-ai"> Chat AI</button>
            <button id="close-toolbar"> Close</button>
        `;
        document.body.appendChild(toolbar);

        // Prevent auto-hide when interacting with sliders
        document.querySelectorAll("#contrast-slider, #brightness-slider, #text-size-slider").forEach((slider) => {
            slider.addEventListener("input", () => clearTimeout(window.toolbarTimeout));
        });

        // Toolbar auto-hide after 5s of inactivity
        toolbar.addEventListener("mouseleave", (event) => {
            if (!event.relatedTarget || !event.relatedTarget.closest("#accessibility-toolbar")) {
                window.toolbarTimeout = setTimeout(() => {
                    toolbar.style.display = "none";  
                }, 5000);
            }
        });

        // Add event listeners
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
            document.body.style.fontSize = `${textSizeValue}px`;
        });

        document.getElementById("colorblind-mode").addEventListener("click", toggleColorblindMode);
        document.getElementById("epilepsy-mode").addEventListener("click", toggleEpilepsyMode);
        document.getElementById("screen-reader-btn").addEventListener("click", toggleScreenReader);
        document.getElementById("voice-nav-btn").addEventListener("click", activateVoiceNavigation);
        document.getElementById("ai-form-fill").addEventListener("click", activateAIFill);
        document.getElementById("chat-ai").addEventListener("click", openAIChat);
        document.getElementById("close-toolbar").addEventListener("click", () => toolbar.remove());
    }
}


// Ensure the variable is declared only once
if (typeof window.colorblindModeActive === "undefined") {
    window.colorblindModeActive = false;
}

// Colorblind Mode Function
function toggleColorblindMode() {
    window.colorblindModeActive = !window.colorblindModeActive;
    document.documentElement.style.filter = window.colorblindModeActive ? "grayscale(80%) contrast(110%)" : "";
    document.body.style.backgroundColor = window.colorblindModeActive ? "#EFEFEF" : "";
    console.log(`Colorblind mode ${window.colorblindModeActive ? "activated" : "deactivated"}.`);
}


// Ensure variable is only declared once
if (typeof window.epilepsyModeActive === "undefined") {
    window.epilepsyModeActive = false;
}

// Improved Epilepsy Mode Function
function toggleEpilepsyMode() {
    window.epilepsyModeActive = !window.epilepsyModeActive;

    if (window.epilepsyModeActive) {
        document.body.style.filter = "brightness(90%) contrast(90%)"; // Reduce brightness & contrast
        document.documentElement.style.scrollBehavior = "auto"; // Disable smooth scrolling
        document.body.style.transition = "none"; // Disable transitions
        document.querySelectorAll("*").forEach(el => {
            el.style.animation = "none";  // Stop all animations
            el.style.transition = "none"; // Remove transitions
        });

        
        document.body.style.backgroundColor = "#f0f0f0"; // Light gray for less visual strain
        document.body.style.color = "#222"; // Dark gray text for readability

        console.log("Epilepsy mode activated: All animations disabled, contrast reduced.");
    } else {
       
        document.body.style.filter = "";
        document.documentElement.style.scrollBehavior = "smooth";
        document.body.style.transition = "";
        document.querySelectorAll("*").forEach(el => {
            el.style.animation = "";
            el.style.transition = "";
        });

        document.body.style.backgroundColor = ""; // Restore default background
        document.body.style.color = ""; // Restore text color

        console.log(" Epilepsy mode deactivated: Restored default settings.");
    }
}

// Ensure variable is declared once
if (typeof window.voiceActive === "undefined") {
    window.voiceActive = false;
}

// Improved Voice Navigation
function activateVoiceNavigation() {
    if (window.voiceActive) {
        console.log(" Voice navigation stopped.");
        window.voiceActive = false;
        return;
    }

    console.log("🎙️ Voice navigation started.");
    window.voiceActive = true;

    try {
        const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.lang = "en-US";
        recognition.continuous = true; // Keeps listening
        recognition.interimResults = false; // Only finalize results
        recognition.start();

        recognition.onresult = (event) => {
            const command = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
            console.log(" Voice command received:", command);

            const focusableElements = Array.from(document.querySelectorAll('a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])'));
            let currentIndex = focusableElements.indexOf(document.activeElement);

            if (command.includes("next")) {
                // Move to next focusable element (like pressing Tab)
                if (currentIndex < focusableElements.length - 1) {
                    focusableElements[currentIndex + 1].focus();
                    console.log("Moved to next element.");
                }
            } else if (command.includes("back")) {
                // Move to previous focusable element (like pressing Shift+Tab)
                if (currentIndex > 0) {
                    focusableElements[currentIndex - 1].focus();
                    console.log("Moved to previous element.");
                }
            } else if (command.includes("open") || command.includes("enter")) {
                // Simulate pressing Enter key
                document.activeElement.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
                document.activeElement.dispatchEvent(new KeyboardEvent("keyup", { key: "Enter" }));
                console.log("Enter key simulated.");
            } else if (command.includes("read")) {
                // Activate Screen Reader
                toggleScreenReader();
                console.log("Screen reader activated.");
            }
        };

        recognition.onerror = (error) => {
            console.error("Voice recognition error:", error);
            window.voiceActive = false;
        };

        recognition.onend = () => {
            console.log(" Voice recognition stopped.");
            window.voiceActive = false;
        };
    } catch (error) {
        console.error(" Speech Recognition Error:", error);
        window.voiceActive = false;
    }
}

// Screen Reader
let screenReaderActive = false;
function toggleScreenReader() {
    if (screenReaderActive) {
        window.speechSynthesis.cancel();
        screenReaderActive = false;
        console.log("Screen reader stopped.");
    } else {
        const speech = new SpeechSynthesisUtterance(document.body.innerText);
        speech.lang = "en-US";
        speech.onend = () => { screenReaderActive = false; };
        window.speechSynthesis.speak(speech);
        screenReaderActive = true;
        console.log("Screen reader activated.");
    }
}

// AI Chat
function openAIChat() {
    const userMessage = prompt("Ask AI a question:");
    if (!userMessage) return;

    chrome.runtime.sendMessage({ action: "fetchAIResponse", prompt: userMessage }, (response) => {
        if (response?.error) alert("AI Error: " + response.error);
        else showChatResponse(response.response);
    });
}

// Show AI Response
function showChatResponse(responseText) {
    alert("AI Response: " + responseText);
}