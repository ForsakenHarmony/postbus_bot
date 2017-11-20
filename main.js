const debug = require('debug');
debug.enable('*');
const log = debug('main');

const Telegraf = require('telegraf');
const session = require('telegraf/session');

const logger = require('./modules/logger');
const reminder = require('./modules/reminder');
const database = require('./db');

const db = database({
  db: process.env.DB_NAME || 'trapsbot',
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || '5984',
  user: process.env.DB_USER || 'admin',
  pass: process.env.DB_PASS || 'admin'
});

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.telegram.getMe().then((botInfo) => {
  bot.options.username = botInfo.username
});

bot.use(logger());
bot.use(session());

reminder({ bot, db });

db.init().then(() => {
  bot.startPolling();
});

process.on('unhandledRejection', (reason, p) =>
  log('Unhandled Rejection at: Promise ', p, reason)
);
