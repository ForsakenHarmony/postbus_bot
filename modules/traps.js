const telegram = require('./telegram');
const rest = require('./rest');

module.exports = (msg) => {
  getTrapImg().then((link) => {
    telegram.sendMessage(msg.chat.id, link);
  }).catch((e) => {
    console.error(e)
  });
};

function getTrapImg() {
  return new Promise((resolve, reject) => {
    rest.rest('https://www.reddit.com/r/transtimelines/random/.json').then((response) => {
      rest.client({path: response.headers.Location}).then((response) => {
        resolve(response.entity[0].data.children[0].data.url);
      }).catch((e) => {
        console.error(e);
        reject(e)
      });
    }).catch((e) => {
      console.error(e);
      reject(e)
    });
  })
}
