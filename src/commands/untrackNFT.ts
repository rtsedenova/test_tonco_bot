import { Context } from "telegraf";
import { getUserTelegramId } from "../services/getUserTgId";
import { getTrackedNFTs, removeTrackedNFTFromS3 } from "../services/s3Service";
import { InlineKeyboardButton } from "telegraf/typings/core/types/typegram";

interface NFT {
  nftAddress: string;
  priceRange: { lower: number; upper: number };
}

interface UserData {
  owner_id: string;
  telegram_id: string;
  nfts: NFT[];
}

interface Callback {
  data: string;
}

export const untrackNFT = async (ctx: Context) => {
  try {
    const telegramId = getUserTelegramId(ctx);

    // Получаем данные из S3
    const allTrackedData: UserData[] = await getTrackedNFTs();

    // Ищем пользователя с заданным telegram_id
    const user = allTrackedData.find((user) => user.telegram_id === telegramId);

    if (user && user.nfts.length > 0) {
      // Формируем список NFT с нумерацией
      const nftList = user.nfts.map((nft, index) => `${index + 1}. ${nft.nftAddress}`).join("\n");

      // Создаем inline-кнопки для каждого NFT
      const buttons: InlineKeyboardButton[][] = user.nfts.map((nft, index) => [
        {
          text: `[#${index + 1}]`,
          callback_data: `delete_nft_${nft.nftAddress}`,
        },
      ]);

      // Отправляем сообщение с кнопками
      await ctx.reply(
        `Ваши отслеживаемые NFT:\n\n${nftList}`,
        {
          reply_markup: { inline_keyboard: buttons },
          parse_mode: "HTML",
        }
      );
    } else {
      // Если пользователь не найден или у него нет NFT
      await ctx.reply("У вас нет отслеживаемых NFT");
    }
  } catch (error) {
    console.error("❌ Ошибка в untrackNFT:", error);
    await ctx.reply("Произошла ошибка при поиске ваших отслеживаемых NFT.");
  }
};

// Обработка callback_query для удаления
export const handleDeleteNFT = async (ctx: Context) => {
  try {
    const telegramId = getUserTelegramId(ctx);

    const callback = ctx.callbackQuery as Callback;
    const callbackData = callback.data; 

    if (callbackData.startsWith("delete_nft_")) {
      const nftAddress = callbackData.replace("delete_nft_", "");

      // Удаляем NFT из S3
      await removeTrackedNFTFromS3(telegramId, nftAddress);

      await ctx.answerCbQuery("NFT успешно удален.");
      await ctx.reply(`NFT с адресом ${nftAddress} был удален из отслеживания.`);

      // Обновляем список отслеживаемых NFT после удаления
      const allTrackedData: UserData[] = await getTrackedNFTs();
      const user = allTrackedData.find((user) => user.telegram_id === telegramId);

      if (user && user.nfts.length > 0) {
        // Формируем новый список NFT с кнопками для оставшихся
        const nftList = user.nfts.map((nft, index) => `${index + 1}. ${nft.nftAddress}`).join("\n");

        const buttons: InlineKeyboardButton[][] = user.nfts.map((nft, index) => [
          {
            text: `[#${index + 1}]`,
            callback_data: `delete_nft_${nft.nftAddress}`,
          },
        ]);

        await ctx.reply(
          `Ваши оставшиеся отслеживаемые NFT:\n\n${nftList}`,
          {
            reply_markup: { inline_keyboard: buttons },
            parse_mode: "HTML",
          }
        );
      } else {
        await ctx.reply("У вас больше нет отслеживаемых NFT.");
      }
    }
  } catch (error) {
    console.error("❌ Ошибка в handleDeleteNFT:", error);
    await ctx.reply("Произошла ошибка при удалении NFT.");
  }
};