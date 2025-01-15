import { Context } from 'telegraf';

export const startCommand = (ctx: Context) => {
  ctx.reply('Привет! Я бот, я запущен');
};
