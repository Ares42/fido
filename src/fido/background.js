chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo && changeInfo.status == 'complete') {
    chrome.tabs.sendMessage(
      tabId,
      { type: 'tabchange', tab },
      (response) => {}
    );
  }
});
