const Scene = require('telegraf/scenes/base');
const { Markup } = require('telegraf');

const { realReply } = require('./util');

module.exports = ({ deleteReminder, getReminders }) => {
  const getTimeString = ({hour, minute}) =>
    String(hour).padStart(2, '0') + ':' + String(minute).padStart(2, '0');

  const msgFromReminders = reminders =>
    reminders.map(reminder => getTimeString(reminder.time)).join('\n');

  const keyboard = reminders => {
    const buttons = () =>
      reminders.map((reminder) => {
        const { _id } = reminder;
        const timeString = getTimeString(reminder.time);
        return Markup.callbackButton(`Delete - ${timeString}`, _id);
      });

    return Markup.inlineKeyboard(
      [...buttons(), Markup.callbackButton('Close', 'close')],
      { columns: 0 }
    ).selective().extra();
  };

  const scene = new Scene('listReminders');

  scene.enter(async ctx => {
    const reminders = await getReminders(ctx.chat.id);

    if (reminders.length === 0) {
      ctx.scene.leave();
      return ctx.reply('No Reminders.');
    }

    ctx.reply(
      msgFromReminders(reminders),
      realReply(ctx, keyboard(reminders))
    );
  });

  scene.on('callback_query', async ctx => {
    const query = ctx.callbackQuery;
    if (query.data === 'close') {
      const reminders = await getReminders(ctx.chat.id);
      if (reminders.length === 0) {
        ctx.scene.leave();
        return ctx.editMessageText('No Reminders.', Markup.removeKeyboard());
      }

      ctx.editMessageText(
        msgFromReminders(reminders),
        Markup.removeKeyboard()
      );
      return ctx.scene.leave();
    }

    await deleteReminder(query.data);

    const reminders = await getReminders(ctx.chat.id);

    if (reminders.length === 0) {
      ctx.scene.leave();
      return ctx.editMessageText('No Reminders.', Markup.removeKeyboard());
    }

    ctx.editMessageText(msgFromReminders(reminders), keyboard(reminders));
  });

  return scene;
};
