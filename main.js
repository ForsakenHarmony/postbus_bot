//Load config before anything
const config = require('./modules/config').getConfig('main');

const telegram = require('./modules/telegram');
const traps = require('./modules/traps');
const reminder = require('./modules/reminder');

let id = 0;

function tick() {
  telegram.getUpdates(id).then((response) => {
    for (let key in response.result) {
      const msg = response.result[key];
      if (msg.message) {
        handleCommandsAndMessages(msg);
      }
      id = response.result[key].update_id + 1;
    }
  }).catch((e) => {
    console.error(e);
  });

  setTimeout(tick, 2000)
}
tick();

function handleCommandsAndMessages(msg) {
  const text = msg.message.text.replace("@trapsrnd_bot", "");
  const chatID = msg.message.chat.id;

  if (text.startsWith("/traps")) {
    telegram.sendMessage(chatID, "Nothing to see here, go along");
    return;
  }
  if (text.startsWith("/reminder")) {
    reminder.setReminder(text.split(" ")[1], chatID);
    return;
  }
  if (text.startsWith("/listmessages")) {
    reminder.listMessages(chatID);
    return;
  }
  if (text.startsWith("/list")) {
    reminder.listReminders(chatID);
    return;
  }
  if (text.startsWith("/cancel")) {
    if (text.startsWith("/cancel_")) {
      reminder.cancelReminder(text.split("_")[1], chatID)
    } else {
      reminder.cancelReminder(text.split(" ")[1], chatID)
    }
    return;
  }
  if (text.startsWith("/addmessage ")) {
    reminder.addMessage(text.substr(text.split(" ")[0].length), chatID);
    return;
  }
}
