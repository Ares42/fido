import apis from '@/src/background/apis';

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo && changeInfo.status == 'complete') {
    chrome.tabs.sendMessage(
      tabId,
      { type: 'tabchange', tab },
      (response) => {}
    );
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (!(request.type in apis)) {
    sendResponse({
      error: `${request.type} Not Implemented`,
    });
    return;
  }

  console.log(apis[request.type]);

  apis[request.type](request)
    .then((response) => {
      console.log('response', response);
      sendResponse(response);
    })
    .catch((error) => {
      console.warn('error', error);
      sendResponse({ error });
    });

  return true; // Indicate that we're sending a response asynchronously.
});
