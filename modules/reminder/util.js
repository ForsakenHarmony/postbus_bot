const { Markup } = require('telegraf');

exports.realReply = (ctx, options = {}) => {
  options.reply_to_message_id = ctx.message.message_id;
  return options;
};

exports.cancelKeyboard = Markup.inlineKeyboard([
  Markup.callbackButton('cancel', 'cancel')
]).forceReply().selective().extra();

exports.exitOnCancel = ctx => {
  const query = ctx.callbackQuery;
  if (query.data === 'cancel') {
    ctx.editMessageText('canceled');
    ctx.scene.leave();
  }
};
