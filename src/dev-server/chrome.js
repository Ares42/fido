import apis from '@/src/background/apis';

// Mock any chrome extension functions we rely on
window['chrome'] = {
  runtime: {
    getURL(src) {
      return src;
    },

    sendMessage(request, callback) {
      if (!(request.type in apis)) {
        callback({
          error: `${request.type} Not Implemented`,
        });
        return;
      }

      apis[request.type](request)
        .then((response) => {
          callback(response);
        })
        .catch((error) => {
          callback({ error });
        });
    },
  },
};
