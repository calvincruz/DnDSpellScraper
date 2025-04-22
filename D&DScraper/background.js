let pendingUpdate = null;

console.log("Background script loaded");

// Initialize interval once
const CHECK_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const updateCheckInterval = setInterval(checkForUpdates, CHECK_INTERVAL_MS);

async function checkForUpdates() {
    try {
        const currentVersion = chrome.runtime.getManifest().version;
        const response = await fetch('https://raw.githubusercontent.com/calvincruz/DnDSpellScraper/main/D%26DScraper/version.json');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const updateData = await response.json();
        console.log("Current version:", currentVersion, "Latest version:", updateData?.latestVersion);

        if (updateData.latestVersion !== currentVersion) {
            pendingUpdate = {
                latestVersion: updateData.latestVersion,
                downloadOptions: updateData.downloadOptions
            };
            console.log("Update available:", pendingUpdate);
        } else {
            console.log("No updates available");
        }
    } catch (error) {
        console.error("Update check failed:", error);
    }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Received message:", request.type);
    
    switch (request.type) {
        case "check_update":
            checkForUpdates().then(() => {
                const response = pendingUpdate ? {
                    type: "update_available",
                    updateAvailable: true,
                    ...pendingUpdate
                } : { 
                    type: "no_update",
                    updateAvailable: false 
                };
                console.log("Sending response:", response);
                sendResponse(response);
            });
            return true; // Required for async response

        case "confirm_update":
            if (!pendingUpdate) {
                console.error("No pending update to confirm");
                return;
            }

            if (request.format === "cancel") {
                console.log("Update canceled by user");
                pendingUpdate = null;
                return;
            }
            const downloadType = request.format;
            const url = pendingUpdate.downloadOptions[downloadType];
            if (!url) {
                console.error("Invalid download format:", request.format);
                return;
            }

            const extension = ".zip";
            const filename = `D&DScraper${extension}`;
            
            console.log("Starting download:", filename);
            chrome.downloads.download({
                url: url,
                filename: filename,
                conflictAction: 'overwrite',
                saveAs: false
            }, (downloadId) => {
                if (chrome.runtime.lastError) {
                    console.error("Download failed:", chrome.runtime.lastError);
                } else {
                    console.log("Download started with ID:", downloadId);
                }
            });

            pendingUpdate = null;
            break;

        default:
            console.warn("Unknown message type:", request.type);
    }
});

// Clean up on extension unload
chrome.runtime.onSuspend.addListener(() => {
    clearInterval(updateCheckInterval);
    console.log("Background script unloaded");
});