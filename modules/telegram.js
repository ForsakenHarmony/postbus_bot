const rest = require('./rest');
const config = require('./config');

const apiKey = config.getConfig('telegram')['apiKey'];

const request = exports.request = (method) => {
  return new Promise((resolve, reject) => {
    rest.client({
      path: 'https://api.telegram.org/' + apiKey + '/' + method
    }).then((response) => {
      resolve(response.entity)
    }).catch((e) => {
      console.error(e);
      reject(e)
    });
  });
};

const getUpdates = exports.getUpdates = (id) => {
  return request("getUpdates?offset=" + id);
};

const sendMessage = exports.sendMessage = (chatID, message) => {
  return request("sendMessage?chat_id=" + chatID + "&text=" + encodeURIComponent(message));
};