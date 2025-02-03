import { Context } from "telegraf";
import { getPoolAddressByNFT } from "../services/poolService";
import fs from "fs";
import path from "path";

const SCALE_FACTOR = Math.pow(2, 96);
const TRACKED_NFTS_FILE = path.resolve("src/data/trackedNFTs.json");

interface NFT {
    nftAddress: string;
    priceRange: { lower: number; upper: number };
}

function loadTrackedNFTs(): NFT[] {
    try {
        if (fs.existsSync(TRACKED_NFTS_FILE)) {
            const data = fs.readFileSync(TRACKED_NFTS_FILE, "utf-8");
            return JSON.parse(data);
        }
    } catch (error) {
        console.error("❌ Ошибка при загрузке отслеживаемых NFT:", error);
    }
    return [];
}

function saveTrackedNFTs(trackedNFTs: NFT[]) {
    try {
        fs.writeFileSync(TRACKED_NFTS_FILE, JSON.stringify(trackedNFTs, null, 2));
    } catch (error) {
        console.error("❌ Ошибка при сохранении отслеживаемых NFT:", error);
    }
}

export async function trackNFT(ctx: Context) {
    try {
        if (!ctx.message || !("text" in ctx.message)) {
            await ctx.reply("Пожалуйста, отправьте текстовое сообщение.");
            return;
        }

        const text = ctx.message.text;
        const [command, nftAddress] = text.split(" ");

        if (command !== "/track") {
            await ctx.reply("Неизвестная команда. Используйте /track <адрес NFT>.");
            return;
        }

        if (!nftAddress) {
            await ctx.reply("Пожалуйста, укажите адрес NFT после команды /track.");
            return;
        }

        const trackedNFTs = loadTrackedNFTs();  

        const existingNFT = trackedNFTs.find(nft => nft.nftAddress === nftAddress);
        if (existingNFT) {
            await ctx.reply(`❗ NFT с адресом <b>${nftAddress}</b> уже отслеживается.`, { parse_mode: "HTML" });
            return;
        }

        const poolInfo = await getPoolAddressByNFT(nftAddress);
        if (!poolInfo) {
            await ctx.reply("Не удалось найти информацию о пуле для данного адреса NFT.");
            return;
        }

        const { tickLower, tickUpper, priceSqrt } = poolInfo;
        const priceSqrtBigInt = BigInt(priceSqrt);
        const normalizedPriceSqrt = Number(priceSqrtBigInt) / SCALE_FACTOR;
        const price = normalizedPriceSqrt ** 2 * 1000;

        const priceLower = Math.pow(1.0001, tickLower) * 1000;
        const priceUpper = Math.pow(1.0001, tickUpper) * 1000;

        trackedNFTs.push({
            nftAddress,
            priceRange: { lower: priceLower, upper: priceUpper },
        });

        saveTrackedNFTs(trackedNFTs);

        trackedNFTs.length = 0;

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
