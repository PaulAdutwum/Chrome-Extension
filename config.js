chrome.runtime.getPackageDirectoryEntry((root) => {
    root.getFile("env.local", {}, (fileEntry) => {
        fileEntry.file((file) => {
            const reader = new FileReader();
            reader.onloadend = function () {
                const text = this.result;
                const key = text.match(/OPENAI_API_KEY=(.+)/)?.[1]?.trim();
                if (key) {
                    chrome.storage.local.set({ "OPENAI_API_KEY": key });
                    console.log("OpenAI API Key Loaded Successfully.");
                } else {
                    console.error("❌ OpenAI API Key not found in env.local file.");
                }
            };
            reader.readAsText(file);
        });
    }, (error) => {
        console.error("⚠️ Error loading env.local file:", error);
    });
});