import { Context } from "telegraf";
import { getPoolAddressByNFT } from "../services/poolService";

const SCALE_FACTOR = Math.pow(2, 96);

export async function getPriceCommand(ctx: Context) {
    try {
        if (!ctx.message || !('text' in ctx.message)) {
            await ctx.reply("Пожалуйста, отправьте текстовое сообщение.");
            return;
        }

        const text = ctx.message.text;

        const [command, nftAddress] = text.split(" ");

        if (command !== "/getprice") {
            await ctx.reply("Неизвестная команда. Используйте /getprice <адрес NFT>.");
            return;
        }

        if (!nftAddress) {
            await ctx.reply("Пожалуйста, укажите адрес NFT после команды /getprice.");
            return;
        }

        const poolInfo = await getPoolAddressByNFT(nftAddress);

        if (!poolInfo) {
            await ctx.reply("Не удалось найти информацию о пуле для данного адреса NFT.");
            return;
        }

        const { id, owner, pool, tickLower, tickUpper, priceSqrt, poolName } = poolInfo;

        const priceSqrtBigInt = BigInt(priceSqrt);  
        const normalizedPriceSqrt = Number(priceSqrtBigInt) / SCALE_FACTOR;  
        const price = normalizedPriceSqrt ** 2 * 1000;  

        let priceLower = Math.pow(1.0001, tickLower);
        let priceUpper = Math.pow(1.0001, tickUpper);
        priceLower *= 1000;
        priceUpper *= 1000;

        const isPriceInRange = price >= priceLower && price <= priceUpper;

        await ctx.reply(
            `Информация о пуле для NFT:\n\n` +
            `ID: ${id}\n` +
            `Владелец: ${owner}\n` +
            `Адрес пула: ${pool}\n` +
            `Название пула: ${poolName}\n` +
            `price_sqrt: ${priceSqrt}\n` +
            `Price: ${price.toFixed(2)}\n` +  
            `Tick Lower: ${tickLower}\n` +
            `Tick Upper: ${tickUpper}\n` +
            `Цена для tickLower: ${priceLower.toFixed(2)}\n` +
            `Цена для tickUpper: ${priceUpper.toFixed(2)}\n` +
            `Цена попадает в диапазон: ${isPriceInRange ? 'Да' : 'Нет'}`
        );
    } catch (error) {
        console.error("Ошибка в getPriceCommand:", error);
        await ctx.reply("Произошла ошибка при обработке вашего запроса. Пожалуйста, попробуйте снова.");
    }
}
