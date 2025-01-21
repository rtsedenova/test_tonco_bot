import { Telegraf } from 'telegraf';
import { BOT_TOKEN } from './config';
import { startCommand } from './commands/start';
import { getPriceCommand } from './commands/getPrice';

if (!BOT_TOKEN) {
    throw new Error('Bot token is not provided');
  }

const bot = new Telegraf(BOT_TOKEN);

bot.start(startCommand);
bot.command('getprice', getPriceCommand);

bot.launch(() => console.log(`Bot is running in ${process.env.NODE_ENV} mode. BOT_TOKEN: ${BOT_TOKEN}`));

process.once('SIGINT', () => {bot.stop('SIGINT');});
process.once('SIGTERM', () => {bot.stop('SIGTERM');});
