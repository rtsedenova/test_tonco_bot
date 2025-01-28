import { Context } from "telegraf";
import { getPoolAddressByNFT } from "../services/poolService";

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

        const { id, owner, pool, tickLower, tickUpper } = poolInfo;

        await ctx.reply(
            `Информация о пуле для NFT:\n\n` +
            `ID: ${id}\n` +
            `Владелец: ${owner}\n` +
            `Адрес пула: ${pool}\n` +
            `Tick Lower: ${tickLower}\n` +
            `Tick Upper: ${tickUpper}`
        );
    } catch (error) {
        console.error("Ошибка в getPriceCommand:", error);
        await ctx.reply("Произошла ошибка при обработке вашего запроса. Пожалуйста, попробуйте снова.");
    }
}
