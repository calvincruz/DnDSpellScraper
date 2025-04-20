// Check for updates periodically
const checkForUpdates = async () => {
    const currentVersion = chrome.runtime.getManifest().version;
    
    try {
      const response = await fetch('https://raw.githubusercontent.com/calvincruz/DnDSpellScraper/main/version.json');
      const { latestVersion, downloadUrl } = await response.json();
      
      if (latestVersion > currentVersion) {
        const update = confirm(`Version ${latestVersion} is available! Download now?`);
        if (update) {
          chrome.tabs.create({ url: downloadUrl });
        }
      }
    } catch (error) {
      console.error("Update check failed:", error);
    }
  };
  
  // Check every 7 days
  checkForUpdates();
  setInterval(checkForUpdates, 7 * 24 * 60 * 60 * 1000);