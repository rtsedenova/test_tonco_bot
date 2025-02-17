import { Context } from "telegraf";
import { getPoolAddressByNFT } from "../services/getPoolInfo";
import { getTrackedNFTs, addTrackedNFTToS3 } from "../services/s3Service";
import { getUserTelegramId } from "../services/getUserTgId";
import { tickToPrice } from "../utils/tickToPrice";
import { UserData, NFT } from "../types"

export async function trackNFT(ctx: Context) {
  try {
    if (!ctx.message || !("text" in ctx.message)) {
      await ctx.reply("Пожалуйста, отправьте текстовое сообщение.");
      return;
    }

    const text = ctx.message.text;
    const [_, nftAddress] = text.split(" ");

    const poolInfo = await getPoolAddressByNFT(nftAddress);
    if (!poolInfo) {
      await ctx.reply("Не удалось найти информацию о пуле для указанного адреса NFT.");
      return;
    }

    const { owner, tickLower, tickUpper, priceSqrt } = poolInfo;

    const priceLower = tickToPrice(tickLower);
    const priceUpper = tickToPrice(tickUpper);

    const telegramId = getUserTelegramId(ctx);
    console.log("User Telegram ID:", telegramId);

    const trackedNFTs = await getTrackedNFTs();

    const user = trackedNFTs.find((item: UserData) => item.telegram_id === telegramId);
    if (user) {
      const existingNFT = user.nfts.find((nft: NFT) => nft.nftAddress === nftAddress);
      if (existingNFT) {
        await ctx.reply(
          `NFT с адресом <b>${nftAddress}</b> уже отслеживается.`,
          { parse_mode: "HTML" }
        );
        return;
      }
    }

    await addTrackedNFTToS3({
      owner_id: owner,
      telegram_id: telegramId,
      nft: {
        nftAddress,
        priceRange: { lower: priceLower, upper: priceUpper },
      },
    });

    await ctx.reply(
      `NFT с адресом <b>${nftAddress}</b> теперь отслеживается 🫡.\n\n` +
      `Диапазон цен: <b>${priceLower.toFixed(2)}</b> - <b>${priceUpper.toFixed(2)}</b>`,
      { parse_mode: "HTML" }
    );
  } catch (error) {
    console.error("Error in trackNFT:", error);
    await ctx.reply("Произошла ошибка при обработке вашего запроса. Пожалуйста, попробуйте снова.");
  }
}