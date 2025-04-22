// updateHandler.js
document.getElementById('zipBtn').addEventListener('click', () => {
    chrome.runtime.sendMessage({ 
        type: "confirm_update", 
        format: "ZIP" 
    });
    document.body.removeChild(document.querySelector('.update-container'));
});

document.getElementById('cancelBtn').addEventListener('click', () => {
    chrome.runtime.sendMessage({ 
        type: "confirm_update", 
        format: "cancel" 
    });
    document.body.removeChild(document.querySelector('.update-container'));
});