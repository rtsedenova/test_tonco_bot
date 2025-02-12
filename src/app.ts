import { Telegraf } from "telegraf";
import { BOT_TOKEN } from "./config";
import { startCommand } from "./commands/start";
import { trackNFT } from "./commands/trackNFT";
import { untrackNFT, handleDeleteNFT } from "./commands/untrackNFT";
import { trackNFTPrices } from "./services/priceTracker";


interface Callback {
  data: string;
}

if (!BOT_TOKEN) {
  throw new Error("Bot token is not provided");
}

const bot = new Telegraf(BOT_TOKEN);

bot.start(startCommand);

bot.command("track", trackNFT);

bot.action("stop_tracking_nft", untrackNFT);

bot.action("start_tracking_nft", async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply("Пожалуйста, отправьте адрес NFT для отслеживания в формате /track <адрес>.");
});

bot.on("callback_query", async (ctx) => {
  const callbackData = (ctx.callbackQuery as Callback).data;

  if (callbackData.startsWith("delete_nft_")) {
    await handleDeleteNFT(ctx);
  }
});

trackNFTPrices(bot);

bot.launch(() => console.log(`Bot is running in ${process.env.NODE_ENV} mode. BOT_TOKEN: ${BOT_TOKEN}`));

process.once("SIGINT", () => { bot.stop("SIGINT"); });
process.once("SIGTERM", () => { bot.stop("SIGTERM"); });
