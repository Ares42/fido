import Vue from 'vue';

import App from '@/src/dev-server/App';

const app = new Vue({
  el: '#app',
  render: (h) => h(App),
});
