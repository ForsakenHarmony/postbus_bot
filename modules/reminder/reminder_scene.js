const Scene = require('telegraf/scenes/base');

const { cancelKeyboard, exitOnCancel, realReply } = require('./util');
const { symbolTimes } = require('../util');

module.exports = ({ addReminder }) => {
  const reminderScene = new Scene('reminder');

  reminderScene.enter(async ctx => {
    const msg = await ctx.reply(
      'Reply with time (H)H:MM',
      realReply(ctx, cancelKeyboard)
    );
    ctx.scene.state.msg = {
      chat_id: msg.chat.id,
      msg_id: msg.message_id,
      user: ctx.from.id
    };
  });

  reminderScene.on('text', async ctx => {
    const msg = ctx.scene.state.msg;
    if (ctx.from.id !== msg.user) return;
    ctx.scene.state.wrongCount = ctx.scene.state.wrongCount || 0;
    if (!/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/.test(ctx.message.text)) {
      const count = ++ctx.scene.state.wrongCount;
      return ctx.telegram.editMessageText(
        msg.chat_id,
        msg.msg_id,
        null,
        `Reply with time (H)H:MM\nWrong syntax ${symbolTimes('!', count)}`,
        cancelKeyboard
      );
    }
    await addReminder({
      chat: msg.chat_id,
      time: ctx.message.text
    });
    ctx.telegram.editMessageText(msg.chat_id, msg.msg_id, null, 'done');
    ctx.reply('Reminder set for: ' + ctx.message.text);
    ctx.scene.leave();
  });
  reminderScene.on('callback_query', exitOnCancel);

  return reminderScene
};


