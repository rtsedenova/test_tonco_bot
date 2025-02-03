import { Context, Markup } from "telegraf";

export const startCommand = (ctx: Context) => {
  ctx.reply(
    "🔹 Кнопка <b>Track NFT</b> — начинает отслеживание NFT.\n" +
    "🔹 Кнопка <b>Untrack NFT</b> — удаляет NFT из списка отслеживаемых.\n" +
    "🔹 Кнопка <b>List</b> — показывает список отслеживаемых NFT.",
    {
      parse_mode: "HTML", 
      reply_markup: Markup.inlineKeyboard([
        [
          Markup.button.callback("Track NFT", "start_tracking_nft"),
          Markup.button.callback("Untrack NFT", "untrack_nft")  
        ]
      ]).reply_markup 
    }
  );
};
