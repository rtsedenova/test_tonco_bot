import { Telegraf } from "telegraf";
import { BOT_TOKEN } from "./config";
import { startCommand } from "./commands/start";
import { trackNFT } from "./commands/trackNFT";
import { untrackNFT } from "./commands/untrackNFT";

if (!BOT_TOKEN) {
  throw new Error("Bot token is not provided");
}

const bot = new Telegraf(BOT_TOKEN);

bot.start(startCommand);

// Обработчик для кнопки "Track NFT"
bot.action("start_tracking_nft", async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply("Пожалуйста, отправьте адрес NFT для отслеживания в формате /track <адрес>.");
});

// Обработчик для кнопки "Untrack NFT"
bot.action("untrack_nft", untrackNFT);

bot.command("track", trackNFT);

bot.launch(() => console.log(`Bot is running in ${process.env.NODE_ENV} mode. BOT_TOKEN: ${BOT_TOKEN}`));

process.once("SIGINT", () => { bot.stop("SIGINT"); });
process.once("SIGTERM", () => { bot.stop("SIGTERM"); });