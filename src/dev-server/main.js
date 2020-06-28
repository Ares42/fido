import Vue from 'vue';

// Must be loaded before Fido
import '@/src/dev-server/chrome';

import App from '@/src/dev-server/App';

const app = new Vue({
  el: '#app',
  render: (h) => h(App),
});
