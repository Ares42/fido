import Vue from 'vue';

import App from '@/src/fido/App';
import { backOff } from 'exponential-backoff';
import { parseDescription } from '@/src/parser';

async function waitFor(predicate) {
  return await backOff(async () => {
    const response = predicate();
    if (response) return response;
    throw 'Still waiting...';
  });
}

async function inject() {
  const container = await waitFor(() => document.getElementById('related'));
  await waitFor(() => !container.querySelector('skeleton-bg-color'));

  const root = document.createElement('div');
  container.insertBefore(root, container.childNodes[0]);
  return new (Vue.extend(App))({
    propsData: {
      metadata: null,
    },
  }).$mount(root);
}

async function watchDescription(app) {
  const description = await waitFor(() =>
    document.getElementById('description')
  );

  let previousText = null;
  const reloadDescription = () => {
    console.log('Reloading Fido content...');
    waitFor(() => description.innerText != previousText)
      .then(() => {
        previousText = description.innerText;
        app.metadata = parseDescription(description.innerText);
      })
      .catch((error) => {
        console.log('Failed to load new description with error', error);
      });
  };

  reloadDescription();
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type == 'tabchange') {
      reloadDescription();
    }
    sendResponse({});
  });
}

function main() {
  console.log('FIDO');
  inject().then((app) => {
    watchDescription(app).catch((error) => {
      console.log('Failed to watch description with error', error);
    });
  });
}

if (document.readyState == 'complete') {
  main();
} else {
  window.addEventListener('load', main);
}
