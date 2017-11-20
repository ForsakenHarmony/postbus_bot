const Scene = require('telegraf/scenes/base');

const { cancelKeyboard, exitOnCancel, realReply } = require('./util');

module.exports = ({ addMessage }) => {
  const addMessageScene = new Scene('addMessage');

  addMessageScene.enter(async ctx => {
    const msg = await ctx.reply(
      'Reply with a message to add',
      realReply(ctx, cancelKeyboard)
    );
    ctx.scene.state.msg = {
      chat_id: msg.chat.id,
      msg_id: msg.message_id,
      user: ctx.from.id
    };
  });

  addMessageScene.on('text', async ctx => {
    const msg = ctx.scene.state.msg;
    if (ctx.from.id !== msg.user) return;
    await addMessage(ctx.message.text);
    ctx.telegram.editMessageText(msg.chat_id, msg.msg_id, null, 'done');
    ctx.reply('Message added: ' + ctx.message.text);
    ctx.scene.leave();
  });
  
  addMessageScene.on('callback_query', exitOnCancel);

  return addMessageScene
};
