import { Context } from "telegraf";
import { getUserTelegramId } from "../services/getUserTgId";
import { getTrackedNFTs, removeTrackedNFTFromS3 } from "../services/s3Service";
import { generateNFTResponse } from "../utils/generateNFTResponse";
import { parseDeleteNFTCallback } from "../utils/callbackParser";
import { UserData, Callback } from "../types/index";

export const untrackNFT = async (ctx: Context) => {
  try {
    const telegramId = getUserTelegramId(ctx);

    const allTrackedData: UserData[] = await getTrackedNFTs();

    const user = allTrackedData.find((user) => user.telegram_id === telegramId);

    if (user && user.nfts.length > 0) {
      const { nftList, buttons } = generateNFTResponse(user);

      await ctx.reply(`Ваши отслеживаемые NFT:\n\n${nftList}`, {
        reply_markup: { inline_keyboard: buttons },
        parse_mode: "HTML",
      });
    } else {
      await ctx.reply("У вас нет отслеживаемых NFT.");
    }
  } catch (error) {
    console.error("Error in untrackNFT:", error);
    await ctx.reply("Произошла ошибка при получении ваших отслеживаемых NFT.");
  }
};

export const handleDeleteNFT = async (ctx: Context) => {
  try {
    const telegramId = getUserTelegramId(ctx);

    const callback = ctx.callbackQuery as Callback;

    if (!callback || !callback.data) {
      await ctx.reply("Некорректные данные в callback.");
      return;
    }

    const nftAddress = parseDeleteNFTCallback(callback.data);

    if (nftAddress) {
      await removeTrackedNFTFromS3(telegramId, nftAddress);

      await ctx.answerCbQuery("NFT успешно удалён.");
      await ctx.reply(`NFT с адресом ${nftAddress} был удалён из отслеживания.`);

      const allTrackedData: UserData[] = await getTrackedNFTs();
      const user = allTrackedData.find((user) => user.telegram_id === telegramId);

      if (user && user.nfts.length > 0) {
        const { nftList, buttons } = generateNFTResponse(user);

        await ctx.reply(`Ваши оставшиеся отслеживаемые NFT:\n\n${nftList}`, {
          reply_markup: { inline_keyboard: buttons },
          parse_mode: "HTML",
        });
      } else {
        await ctx.reply("У вас больше нет отслеживаемых NFT.");
      }
    } else {
      await ctx.reply("Некорректные данные NFT.");
    }
  } catch (error) {
    console.error("Error in handleDeleteNFT:", error);
    await ctx.reply("Произошла ошибка при удалении NFT.");
  }
};