const schedule = require('node-schedule');
const crypto = require('crypto');

const telegram = require('./telegram');
const config = require('./config');

const {messages, reminders} = config.getConfig('reminder');
const jobs = {};

const setReminder = exports.setReminder = (timeString, chatID) => {
  if (!/[0-9]{1,2}:[0-9]{2}$/.test(timeString)) {
    telegram.sendMessage(chatID, "Wrong syntax (H)H:MM");
    return;
  }
  console.log(timeString);
  const id = crypto.randomBytes(4).toString('hex');
  const time = timeString.split(':');
  const timeObj = {"hour": parseInt(time[0]), "minute": parseInt(time[1])};
  const reminder = {
    id: id,
    time: timeObj,
    chatID: chatID
  };
  addReminderInternal(reminder);
  reminders[id] = {
    time: timeObj,
    chatID: chatID
  };
  save();
  telegram.sendMessage(chatID, "Reminder added for: " + timeString + " - " + id);
};

const listReminders = exports.listReminders = (chatID) => {
  let message = "";
  for (let id in reminders) {
    const reminder = reminders[id];
    if (reminder.chatID === chatID) {
      let timeString = pad(reminder.time.hour, 2) + ":" + pad(reminder.time.minute, 2)
      message += timeString + " - /cancel_" + id + "\n"
    }
  }

  if (message === "") {
    message = "You have no reminders set";
  }

  telegram.sendMessage(chatID, message);
};

const cancelReminder = exports.cancelReminder = (id, chatID) => {
  if (!id || !jobs[id]) {
    telegram.sendMessage(chatID, "No reminder with that ID");
    return
  }
  jobs[id].cancel();
  delete jobs[id];
  delete reminders[id];
  save();
  telegram.sendMessage(chatID, "Reminder deleted!");
};

const addMessage = exports.addMessage = (message, chatID) => {
  if (!message) {
    telegram.sendMessage(chatID, "You have to add a message");
    return
  }
  messages.push(message);
  save();
  telegram.sendMessage(chatID, "Added reminder message: " + message);
};

const listMessages = exports.listMessages = (chatID) => {
  let message = "";
  for (let key in messages) {
    message += messages[key] + "\n"
  }
  if (message === "") {
    message = "You have no messages set";
  }
  telegram.sendMessage(chatID, message);
};

function save() {
  config.saveConfig('reminder', {reminders: reminders, messages: messages});
}

function addReminderInternal(reminder) {
  console.log(reminder);
  jobs[reminder.id] = schedule.scheduleJob(reminder.time, () => {
    remind(reminder);
  });
}

function remind(reminder) {
  let message = "";
  if (messages.length === 0) {
    telegram.sendMessage(reminder.chatID, "Reminder! - Consider adding a message");
    return;
  }
  telegram.sendMessage(reminder.chatID, messages[getRandomInt(0, messages.length - 1)]);

  console.log(reminder.time, "reminded");
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

function init() {
  for (let id in reminders) {
    const reminder = reminders[id];
    reminder.id = id;
    addReminderInternal(reminder);
  }
}

init();