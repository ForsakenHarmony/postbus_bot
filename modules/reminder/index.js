const debug = require('debug')('modules:reminder');
const cron = require('cron');
const Stage = require('telegraf/stage');

const reminderScene = require('./reminder_scene');
const addMessageScene = require('./add_message_scene');
const listRemindersScene = require('./list_reminders_scene');

const { randomInt } = require('../util');

module.exports = ({ bot, db }) => {
  const jobs = {};

  function scheduleReminder (id, reminder) {
    const { hour, minute } = reminder.time;
    const job = new cron.CronJob({
      cronTime: `00 ${minute} ${hour} * * *`,
      onTick: () => {
        remind(reminder);
      },
      timeZone: process.env.TZ || 'Europe/Dublin'
    });
    job.start();
    jobs[id] = job;
  }

  function cancelReminder(id) {
    const job = jobs[id];
    if(!job) {
      throw new Error('Reminder doesn\'t exist');
    }
    job.stop();
    delete jobs[id];
  }

  async function remind (reminder) {
    const messages = await db.find({ type: 'message' });
    const message = messages[randomInt(0, messages.length - 1)].text || 'Reminder! - Consider adding a message';
    bot.telegram.sendMessage(reminder.chat, message);
    debug('reminded %s %s', reminder.chat, reminder.time);
  }

  async function addReminder ({ chat, time }) {
    const split = time.split(':').map(e => parseInt(e));
    const timeObj = { hour: split[0], minute: split[1] };
    if (timeObj.hour > 23 || timeObj.minute > 59) {
      throw new Error('wrong time format');
    }

    const reminder = {
      type: 'reminder',
      time: timeObj,
      chat
    };

    const { id } = await db.insert(reminder);
    scheduleReminder(id, reminder);
  }

  const deleteReminder = async id => {
    if (!id) {
      throw new Error('You have to specify the id');
    }
    cancelReminder(id);
    await db.delete(id);
  };

  const addMessage = async message => {
    await db.insert({
      type: 'message',
      text: message
    });
  };

  const deleteMessage = async id => {
    if (!id) {
      throw new Error('You have to specify the id');
    }
    await db.delete(id);
  };

  // TODO: ability to delete messages (permission? also for adding)
  const listMessages = async ctx => {
    const messages = await db.find({ type: 'message' });
    if (messages.length === 0) {
      return ctx.reply('No messages, add one!');
    }
    return ctx.reply(messages.map(m => m.text).join('\n'));
  };

  const getReminders = async (chat) => {
    return await db.find({ type: 'reminder', chat })
  };

  const stage = new Stage();

  stage.register(reminderScene({ addReminder }));
  stage.register(addMessageScene({ addMessage }));
  stage.register(listRemindersScene({ deleteReminder, getReminders }));

  bot.use(stage.middleware());

  bot.command('reminder', ctx => ctx.scene.enter('reminder'));
  bot.command('addmessage', ctx => ctx.scene.enter('addMessage'));
  bot.command('list', ctx => ctx.scene.enter('listReminders'));
  bot.command('listmessages', listMessages);

  db.find({ type: 'reminder' }).then(reminders =>
    reminders.map(reminder => scheduleReminder(reminder._id, reminder))
  );
};
