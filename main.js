const debug = require('debug');
debug.enable('*');
const log = debug('main');

const Telegraf     = require('telegraf');
const RedisSession = require('telegraf-session-redis');
const TelegrafFlow = require('telegraf-flow');

const logger   = require('./modules/logger');
const reminder = require('./modules/reminder');

const app = new Telegraf(process.env.BOT_TOKEN);

app.telegram.getMe().then((botInfo) => {
  app.options.username = botInfo.username
});

const session = new RedisSession({
  store: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379
  },
  ttl  : 60 * 60 * 60,
});
const flow    = new TelegrafFlow();

app.use(logger());

reminder.init(flow, session.client, app.telegram);

app.command('listmessages', reminder.listMessages);

app.use(session.middleware());
app.use(flow.middleware());


app.startPolling();
