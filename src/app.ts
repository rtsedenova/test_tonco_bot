import { Telegraf } from 'telegraf';
import { BOT_TOKEN } from './config';
import { startCommand } from './commands/start';

const bot = new Telegraf(BOT_TOKEN);

bot.start(startCommand);

bot.launch(() => console.log('Bot is running..'));

process.once('SIGINT', () => {bot.stop('SIGINT');});
process.once('SIGTERM', () => {bot.stop('SIGTERM');});
