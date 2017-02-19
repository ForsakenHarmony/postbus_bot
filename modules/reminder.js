const debug = require('debug')('modules:reminder');

const schedule = require('node-schedule');
const crypto   = require('crypto');

const { Markup } = require('telegraf');
const { Scene }  = require('telegraf-flow');

const { symbolTimes, randomInt, pad } = require('./util');

let redis;
let telegram;
let flow;

const jobs      = {};
const reminders = {};
const messages  = {};

exports.init = (_flow, _redis, _telegram) => {
  redis    = _redis;
  telegram = _telegram;
  flow     = _flow;
  
  flow.command('reminder', (ctx) => ctx.flow.enter('reminder'));
  // reminder
  (() => {
    const keyboard = Markup.inlineKeyboard([
      Markup.callbackButton('cancel', 'cancel')
    ]).forceReply().selective().extra();
    
    const scene = new Scene('reminder');
    scene.enter(async (ctx) => {
      const msg          = await ctx.reply('Reply with time (H)H:MM', keyboard);
      ctx.flow.state.msg = { chat_id: msg.chat.id, msg_id: msg.message_id };
    });
    scene.on('text', async (ctx) => {
      const msg                 = ctx.flow.state.msg;
      ctx.flow.state.wrongCount = ctx.flow.state.wrongCount || 0;
      if (!/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/.test(ctx.message.text)) {
        const count = ++ctx.flow.state.wrongCount;
        return ctx.telegram.editMessageText(
          msg.chat_id, msg.msg_id, null,
          `Reply with time (H)H:MM\nWrong syntax ${symbolTimes('!', count)}`,
          keyboard
        );
      }
      await addReminder({
        chat: msg.chat_id,
        time: ctx.message.text,
      });
      ctx.telegram.editMessageText(
        msg.chat_id, msg.msg_id, null, 'done'
      );
      ctx.reply('Reminder set for: ' + ctx.message.text);
      ctx.flow.leave();
    });
    scene.on('callback_query', (ctx) => {
      const query = ctx.callbackQuery;
      if (query.data === 'cancel') {
        ctx.editMessageText('canceled');
        ctx.flow.leave();
      }
    });
    flow.register(scene);
  })();
  
  flow.command('addmessage', (ctx) => ctx.flow.enter('addmessage'));
  // reminder
  (() => {
    const keyboard = Markup.inlineKeyboard([
      Markup.callbackButton('cancel', 'cancel')
    ]).forceReply().selective().extra();
    
    const scene = new Scene('addmessage');
    scene.enter(async (ctx) => {
      const msg          = await ctx.reply('Reply with a message to add', keyboard);
      ctx.flow.state.msg = { chat_id: msg.chat.id, msg_id: msg.message_id };
    });
    scene.on('text', async (ctx) => {
      const msg = ctx.flow.state.msg;
      await addMessage(ctx.message.text);
      ctx.telegram.editMessageText(
        msg.chat_id, msg.msg_id, null, 'done'
      );
      ctx.reply('Message added: ' + ctx.message.text);
      ctx.flow.leave();
    });
    scene.on('callback_query', (ctx) => {
      const query = ctx.callbackQuery;
      if (query.data === 'cancel') {
        ctx.editMessageText('canceled');
        ctx.flow.leave();
      }
    });
    flow.register(scene);
  })();
  
  flow.command('list', (ctx) => ctx.flow.enter('listReminders'));
  // listReminders
  (() => {
    
    const msgFromReminders = (_reminders) => {
      return Object.keys(_reminders).map((e) => {
        const reminder = _reminders[e];
        return pad(reminder.time.hour, 2) + ':' + pad(reminder.time.minute, 2);
      }).join('\n');
    };
    
    const keyboard = (_reminders) => {
      const buttons = () => Object.keys(_reminders).map((e) => {
        const reminder = _reminders[e];
        debug(reminder);
        const timeString = pad(reminder.time.hour, 2) + ':' + pad(reminder.time.minute, 2);
        return Markup.callbackButton(`Delete - ${timeString}`, e);
      });
      
      return Markup.inlineKeyboard([
        ...buttons(),
        Markup.callbackButton('Close', 'close'),
      ], { columns: 0 }).selective().extra();
    };
    
    const remindersForChat = (_reminders, chatId) => {
      return Object.keys(_reminders).reduce((acc, val) => {
        const reminder = _reminders[val];
        if (reminder.chat === chatId) {
          acc[val] = reminder;
        }
        return acc;
      }, {});
    };
    
    let _reminders;
    
    const scene = new Scene('listReminders');
    scene.enter((ctx) => {
      _reminders = remindersForChat(reminders, ctx.chat.id);
      
      if (Object.keys(_reminders).length === 0) {
        ctx.flow.leave();
        return ctx.reply('No Reminders.')
      }
      
      ctx.reply(msgFromReminders(_reminders), keyboard(_reminders));
    });
    scene.on('callback_query', async (ctx) => {
      const query = ctx.callbackQuery;
      if (query.data === 'close') {
        if (Object.keys(_reminders).length === 0) {
          ctx.flow.leave();
          return ctx.editMessageText('No Reminders.', Markup.removeKeyboard())
        }
        
        ctx.editMessageText(msgFromReminders(_reminders), Markup.removeKeyboard());
        return ctx.flow.leave();
      }
      
      await deleteReminder(query.data);
      _reminders = remindersForChat(reminders, ctx.chat.id);
      
      if (Object.keys(_reminders).length === 0) {
        ctx.flow.leave();
        return ctx.editMessageText('No Reminders.', Markup.removeKeyboard())
      }
      
      ctx.editMessageText(msgFromReminders(_reminders), keyboard(_reminders));
    });
    flow.register(scene);
  })();
  
  redis.keysAsync('reminders:*').then(async (res) => {
    const ids        = res.map((e) => e.split(':')[1]);
    const promises   = res.map((e) => redis.getAsync(e));
    const _reminders = await Promise.all(promises);
    ids.forEach((e, i) => {
      reminders[e] = JSON.parse(_reminders[i]);
      scheduleReminder(reminders[e]);
    });
    debug('loaded %s reminders', Object.keys(_reminders).length);
  });
  
  redis.keysAsync('messages:*').then(async (res) => {
    const ids       = res.map((e) => e.split(':')[1]);
    const promises  = res.map((e) => redis.getAsync(e));
    const _messages = await Promise.all(promises);
    ids.forEach((e, i) => {
      messages[e] = _messages[i];
    });
    debug('loaded %s messages', Object.keys(_messages).length);
  });
};

async function remind(reminder) {
  const keys    = Object.keys(messages);
  const message = messages[keys[randomInt(0, keys.length - 1)]]
                  || 'Reminder! - Consider adding a message';
  
  telegram.sendMessage(reminder.chat, message);
  debug('reminded %s %s', reminder.chat, reminder.time);
}

const addReminder = exports.addReminder = async ({ chat, time }) => {
  const reminder_id = crypto.randomBytes(6).toString('hex');
  const split       = time.split(':').map((e) => parseInt(e));
  const timeObj     = { hour: split[0], minute: split[1] };
  if (timeObj.hour > 23 || timeObj.minute > 59) throw new Error('wrong time format');
  
  const reminder = {
    id  : reminder_id,
    time: timeObj,
    chat,
  };
  
  await redis.setAsync(`reminders:${reminder_id}`, JSON.stringify(reminder));
  
  reminders[reminder_id] = reminder;
  scheduleReminder(reminder);
};

function scheduleReminder(reminder) {
  jobs[reminder.id] = schedule.scheduleJob(reminder.time, () => {
    remind(reminder);
  });
}

const deleteReminder = exports.deleteReminder = async (id) => {
  if (!id || !jobs[id]) {
    throw new Error('Reminder doesn\'t exist')
  }
  jobs[id].cancel();
  delete jobs[id];
  delete reminders[id];
  return await redis.delAsync(`reminders:${id}`);
};

const addMessage = exports.addMessage = async (message) => {
  const message_id = crypto.randomBytes(6).toString('hex');
  await redis.setAsync(`messages:${message_id}`, message);
  messages[message_id] = message;
};

const deleteMessage = exports.deleteMessage = async (id) => {
  if (!id || !messages[id]) {
    throw new Error('Message doesn\'t exist')
  }
  delete messages[id];
  return await redis.delAsync(`messages:${id}`);
};

// TODO: ability to delete messages (permission? also for adding)
exports.listMessages = (ctx) => {
  debug('test');
  return ctx.reply(Object.values(messages).join('\n'));
};
