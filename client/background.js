// background.js
/* eslint-disable no-undef */

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.renderMethod) {
    sendResponse({}); // Acknowledge the message
    if (sender.tab && sender.tab.id) {
      // Include the tab ID in the message
      chrome.tabs.sendMessage(sender.tab.id, {
        tabId: sender.tab.id, // Include the tab ID here
        renderMethod: message.renderMethod,
        data: message.data
      });
    }
  }
});