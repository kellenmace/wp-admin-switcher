/**
 * WordPress Admin Switcher Service Worker
 */

(() => {
  async function sendMessageToCurrentTab(message) {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    chrome.tabs.sendMessage(tab.id, { toggle: true });
  }

  // Add keyboard shortcut event listener
  chrome.commands.onCommand.addListener(sendMessageToCurrentTab);

  // Add extension icon click event listener
  chrome.action.onClicked.addListener(sendMessageToCurrentTab);
})();
