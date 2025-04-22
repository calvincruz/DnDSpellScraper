let pendingUpdate = null;


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

        if (updateData.latestVersion !== currentVersion) {
            pendingUpdate = {
                latestVersion: updateData.latestVersion,
                downloadOptions: updateData.downloadOptions
            };
        }
    } catch (error) {
        console.error("Update check failed:", error);
    }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
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
                sendResponse(response);
            });
            return true; // Required for async response

        case "confirm_update":
            if (!pendingUpdate) {
                console.error("No pending update to confirm");
                return;
            }

            if (request.format === "cancel") {
                pendingUpdate = null;
                return;
            }
            const url = pendingUpdate.downloadOptions["ZIP"];
            if (!url) {
                console.error("Invalid download format:", request.format);
                return;
            }

            const filename = `D&DSpellScraper.zip`;

            chrome.downloads.download({
                url: url,
                filename: filename,
                conflictAction: 'overwrite',
                saveAs: true
            }, (downloadId) => {
                if (chrome.runtime.lastError) {
                    console.error("Download failed:", chrome.runtime.lastError);
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
});