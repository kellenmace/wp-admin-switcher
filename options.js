document.addEventListener('DOMContentLoaded', () => {
    const openInNewTabCheckbox = document.getElementById('openInNewTab');
    const saveButton = document.getElementById('save');
      
    // Load settings
    chrome.storage.sync.get(['openInNewTab'], (settings) => {
      openInNewTabCheckbox.checked = settings.openInNewTab || false;
    });
  
    // Save settings
    saveButton.addEventListener('click', () => {
      chrome.storage.sync.set({
        openInNewTab: openInNewTabCheckbox.checked
      }, () => {
        alert('Settings saved');
      });
    });
  });