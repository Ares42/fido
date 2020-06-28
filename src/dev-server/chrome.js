// Mock any chrome extension functions we rely on
window['chrome'] = {
  runtime: {
    getURL(src) {
      return src;
    },
  },
};
