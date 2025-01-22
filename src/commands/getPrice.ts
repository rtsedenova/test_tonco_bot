import { Context } from "telegraf";
import { getPriceSqrt } from "../services/poolService";

export async function getPriceCommand(ctx: Context) {
    try {
        if (!ctx.message || !('text' in ctx.message)) {
            await ctx.reply("Пожалуйста, отправьте текстовое сообщение.");
            return;
        }

        const text = ctx.message.text;

        const [command, poolAddress] = text.split(" ");

        if (command !== "/getprice") {
            await ctx.reply("Неизвестная команда. Используйте /getprice <адрес пула>.");
            return;
        }

        if (!poolAddress) {
            await ctx.reply("Пожалуйста, укажите адрес пула после команды /getprice.");
            return;
        }

        const { poolName, priceSqrt, price } = await getPriceSqrt(poolAddress);

        await ctx.reply(
            `Информация о пуле:\n\nИмя: ${poolName}\nАдрес: ${poolAddress}\nPrice_sqrt: ${priceSqrt}\nЦена: ${price.toFixed(6)}`
        );
    } catch (error) {
        console.error("Ошибка в getPriceCommand:", error);
        await ctx.reply("Произошла ошибка при обработке вашего запроса. Проверьте адрес пула и попробуйте снова.");
    }
}
