import { Context } from 'telegraf';

export const startCommand = (ctx: Context) => {
  ctx.reply('Привет! Что вы хотите сделать?', {
    reply_markup: {
      inline_keyboard: [
        [
          { text: 'Установить минимальную цену', callback_data: 'set_min_price' },
          { text: 'Установить максимальную цену', callback_data: 'set_max_price' },
        ],
        [{ text: 'Ввести адрес пула', callback_data: 'set_pool_address' }],
      ],
    },
  });
};
