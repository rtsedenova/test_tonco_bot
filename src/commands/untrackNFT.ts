import { Context } from "telegraf";
import { getUserTelegramId } from "../services/getUserTelegramId";
import { getTrackedNFTs } from "../services/s3Service";

interface NFT {
  nftAddress: string;
  priceRange: { lower: number; upper: number };
}

interface UserData {
  owner_id: string;
  telegram_id: string;
  nfts: NFT[];
}

export const untrackNFT = async (ctx: Context) => {
  try {
    const telegramId = getUserTelegramId(ctx);

    // Получаем данные из S3
    const allTrackedData: UserData[] = await getTrackedNFTs();

    // Ищем пользователя с заданным telegram_id
    const user = allTrackedData.find((user) => user.telegram_id === telegramId);

    if (user) {
      // Если пользователь найден, выводим все его NFT
      const nftAddresses = user.nfts.map((nft: NFT) => nft.nftAddress).join("\n");

      await ctx.reply(
        `Ваши отслеживаемые NFT:\n\n${nftAddresses}`,
        { parse_mode: "HTML" }
      );
    } else {
      // Если пользователь не найден
      await ctx.reply("Ваш Telegram ID не найден в базе данных.");
    }
  } catch (error) {
    console.error("Error in untrackNFT:", error);
    await ctx.reply("Произошла ошибка при поиске ваших отслеживаемых NFT.");
  }
};
