import Vue from 'vue';

import App from '@/src/fido/App';
import { backOff } from 'exponential-backoff';
import { parseDescription } from '@/src/parser';

function inject() {
  const container = document.getElementById('related');
  if (!container) {
    console.error('Unable to inject Fido');
    return;
  }

  const root = document.createElement('div');
  container.insertBefore(root, container.childNodes[0]);
  return new (Vue.extend(App))({
    propsData: {
      metadata: null,
    },
  }).$mount(root);
}

async function getDescriptionElement() {
  return await backOff(async () => {
    const description = document.getElementById('description');
    if (description) return description;
    throw 'Unable to locate the video description';
  });
}

async function waitForDescriptionChange(element, previousText) {
  return await backOff(() => {
    if (element.innerText != previousText) {
      return element.innerText;
    }

    throw 'Still waiting for new text';
  });
}

async function watchDescription(app) {
  const description = await getDescriptionElement();

  let previousText = null;
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type == 'tabchange') {
      console.log('Reloading Fido content...');
      waitForDescriptionChange(description, previousText)
        .then((text) => {
          previousText = text;
          app.metadata = parseDescription(text);
        })
        .catch((error) => {
          console.log('Failed to load new description with error', error);
        });
    }
    sendResponse({});
  });
}

function main() {
  const app = inject();
  watchDescription(app).catch((error) => {
    console.log('Failed to watch description with error', error);
  });
}

if (document.readyState == 'complete') {
  main();
} else {
  window.addEventListener('load', main);
}
