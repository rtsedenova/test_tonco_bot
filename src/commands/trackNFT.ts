import { Context } from "telegraf";
import { getPoolAddressByNFT } from "../services/getPoolInfo";
import { getTrackedNFTs, addTrackedNFTToS3 } from "../services/s3Service";
import { getUserTelegramId } from "../services/getUserTelegramId";  

const SCALE_FACTOR = Math.pow(2, 96);

export async function trackNFT(ctx: Context) {
    try {
        if (!ctx.message || !("text" in ctx.message)) {
            await ctx.reply("Пожалуйста, отправьте текстовое сообщение.");
            return;
        }

        const text = ctx.message.text;
        const [command, nftAddress] = text.split(" ");

        const poolInfo = await getPoolAddressByNFT(nftAddress);
        if (!poolInfo) {
            await ctx.reply("Не удалось найти информацию о пуле для данного адреса NFT.");
            return;
        }

        const { owner, tickLower, tickUpper, priceSqrt } = poolInfo;
        const priceSqrtBigInt = BigInt(priceSqrt);
        const normalizedPriceSqrt = Number(priceSqrtBigInt) / SCALE_FACTOR;
        const priceLower = Math.pow(1.0001, tickLower) * 1000;
        const priceUpper = Math.pow(1.0001, tickUpper) * 1000;

        const telegramId = getUserTelegramId(ctx);

        // Проверяем, существует ли уже пользователь и этот NFT
        const trackedNFTs = await getTrackedNFTs();
        const user = trackedNFTs.find((item: any) => item.telegram_id === telegramId);
        if (user) {
            const existingNFT = user.nfts.find((nft: any) => nft.nftAddress === nftAddress);
            if (existingNFT) {
                await ctx.reply(
                    `NFT с адресом <b>${nftAddress}</b> уже отслеживается.`,
                    { parse_mode: "HTML" }
                );
                return;
            }
        }

        // Добавляем или обновляем информацию в S3
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
            `Ценовой диапазон: <b>${priceLower.toFixed(2)}</b> - <b>${priceUpper.toFixed(2)}</b>`,
            { parse_mode: "HTML" }
        );
    } catch (error) {
        console.error("❌ Ошибка в trackNFT:", error);
        await ctx.reply("Произошла ошибка при обработке вашего запроса. Пожалуйста, попробуйте снова.");
    }
}