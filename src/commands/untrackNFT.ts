import { Context, Markup } from "telegraf";
import fs from "fs";
import path from "path";

// Путь к файлу, где хранятся отслеживаемые NFT
const TRACKED_NFTS_FILE = path.resolve("src/data/trackedNFTs.json");

interface NFT {
    nftAddress: string;
    priceRange: { lower: number; upper: number };
}

// Функция для загрузки отслеживаемых NFT из файла
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

// Функция для сохранения отслеживаемых NFT в файл
function saveTrackedNFTs(trackedNFTs: NFT[]) {
    try {
        fs.writeFileSync(TRACKED_NFTS_FILE, JSON.stringify(trackedNFTs, null, 2));
    } catch (error) {
        console.error("❌ Ошибка при сохранении отслеживаемых NFT:", error);
    }
}

// Функция для отображения списка отслеживаемых NFT с кнопками для удаления
export async function listTrackedNFTs(ctx: Context) {
    const trackedNFTs = loadTrackedNFTs();  // Загружаем все отслеживаемые NFT

    if (trackedNFTs.length === 0) {
        await ctx.reply("У вас нет отслеживаемых NFT.");
        return;
    }

    // Генерируем пронумерованный список
    const nftList = trackedNFTs.map((nft, index) => {
        return `[#${index + 1}] <b>${nft.nftAddress}</b>`; // Добавляем номер перед адресом
    }).join("\n");

    // Кнопки для удаления: Номера кнопок будут соответствовать порядковым номерам
    const buttons = trackedNFTs.map((nft, index) =>
        Markup.button.callback(`${index + 1}`, `untrack_${index}`) // Номер на кнопке
    );

    // Отправляем сообщение со списком и кнопками для удаления
    await ctx.reply(`Для прекращения отслеживания нажмите на номер адреса NFT:\n\n${nftList}`, {
        parse_mode: "HTML",
        reply_markup: Markup.inlineKeyboard(buttons, { columns: 3 }).reply_markup, // Кнопки с номерами
    });
}

// Тип для контекста действия с кнопкой
interface UntrackNFTActionContext extends Context {
    match?: RegExpMatchArray; // Для обработки результата кнопки
}

// Действие для кнопки прекращения отслеживания NFT
export async function untrackNFTAction(ctx: UntrackNFTActionContext) {
    try {
        if (!ctx.match) {
            await ctx.reply("Не удалось извлечь данные из кнопки.");
            return;
        }

        // Получаем номер NFT из данных действия кнопки
        const index = parseInt(ctx.match[1], 10); // Извлекаем номер (индекс) из строки

        let trackedNFTs = loadTrackedNFTs();

        // Удаляем NFT из списка отслеживаемых по индексу
        const nftToRemove = trackedNFTs[index];
        if (!nftToRemove) {
            await ctx.reply("NFT с таким номером не найдено.");
            return;
        }

        trackedNFTs = trackedNFTs.filter((_, i) => i !== index); // Удаляем по индексу
        saveTrackedNFTs(trackedNFTs);

        await ctx.answerCbQuery(); // Ожидание ответа на клик по кнопке
        await ctx.reply(`NFT с адресом <b>${nftToRemove.nftAddress}</b> больше не отслеживается.`, { parse_mode: "HTML" });
    } catch (error) {
        console.error("❌ Ошибка в untrackNFTAction:", error);
        await ctx.reply("Произошла ошибка при прекращении отслеживания NFT.");
    }
}
