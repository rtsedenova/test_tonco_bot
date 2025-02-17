import { Telegraf } from "telegraf";
import { BOT_TOKEN } from "./config";
import { startCommand } from "./commands/start";
import { trackNFT } from "./commands/trackNFT";
import { untrackNFT, handleDeleteNFT } from "./commands/untrackNFT";
import { trackNFTPrices } from "./services/priceTracker";
import { Callback } from "./types";


if (!BOT_TOKEN) {
  throw new Error("Бот не получил BOT_TOKEN!");
}

const bot = new Telegraf(BOT_TOKEN);

bot.start(startCommand);

bot.command("track", trackNFT);

bot.action("stop_tracking_nft", untrackNFT);

bot.action("start_tracking_nft", async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply("Отправьте адрес NFT в таком формате /track <адрес>.");
});

bot.on("callback_query", async (ctx) => {
  const callbackData = (ctx.callbackQuery as Callback).data;

  if (callbackData.startsWith("delete_nft_")) {
    await handleDeleteNFT(ctx);
  }
});

const startTracking = (bot: any) => {
  setInterval(async () => {
    try {
      await trackNFTPrices(bot);
    } catch (error) {
      console.error('❌ Ошибка при проверке цен NFT:', error);
    }
  }, 60000);  
};

startTracking(bot);

bot.launch(() => console.log(`${process.env.NODE_ENV} mode | BOT_TOKEN: ${BOT_TOKEN}`));

process.once("SIGINT", () => { bot.stop("SIGINT"); });
process.once("SIGTERM", () => { bot.stop("SIGTERM"); });
