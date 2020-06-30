import Vue from 'vue';

import App from '@/src/fido/App';
import { backOff } from 'exponential-backoff';
import { parseDescription } from '@/src/parser';

async function waitFor(predicate) {
  return await backOff(
    async () => {
      let response;
      try {
        response = predicate();
      } catch (error) {
        console.warn('[fido] unexpected error ', error);
      }
      if (response) return response;
      throw 'Still waiting...';
    },
    {
      jitter: 'none',
      maxDelay: 5 * 1000,
      numOfAttempts: Infinity,
    }
  );
}

async function inject() {
  console.log('[fido] Waiting for injection');
  const container = await waitFor(() => {
    const element = document.getElementById('related');
    if (
      !element ||
      element.parentElement.id == 'related-skeleton' ||
      !element.querySelector('#items') ||
      element.querySelector('#items').children.length <= 1
    ) {
      return null;
    }
    return element;
  });
  console.log('[fido] Injecting');

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
        app.metadata = parseDescription(description);
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
  inject()
    .then((app) => {
      watchDescription(app).catch((error) => {
        console.log('Failed to watch description with error', error);
      });
    })
    .catch((error) => {
      console.warn('[fido] Failed injection with error:', error);
    });
}

if (document.readyState == 'complete') {
  main();
} else {
  window.addEventListener('load', main);
}
