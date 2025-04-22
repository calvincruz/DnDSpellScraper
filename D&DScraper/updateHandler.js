// This runs in the about:blank window's context

console.log("Handler loaded!"); // Check in blob window's console

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