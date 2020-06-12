import Vue from 'vue';

import App from '@/src/fido/App';

window.addEventListener('load', () => {
  const container = document.getElementById('secondary-inner');
  if (!container) {
    console.error('Unable to inject Fido');
  }

  const root = document.createElement('div');
  container.insertBefore(root, container.childNodes[0]);
  new Vue({ render: (h) => h(App) }).$mount(root);
});
