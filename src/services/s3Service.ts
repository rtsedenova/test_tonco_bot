import AWS from "aws-sdk";
import { AWS_ACCESS_KEY, AWS_SECRET_ACCESS_KEY, AWS_BUCKET_NAME, AWS_REGION } from "../config";

const s3 = new AWS.S3({
    accessKeyId: AWS_ACCESS_KEY,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
    region: AWS_REGION,
});

const NFT_DATA_KEY = "trackedNFTs/nftData.json";

// Чтение данных из S3
const getDataFromS3 = async (): Promise<any[]> => {
    try {
        const data = await s3.getObject({ Bucket: AWS_BUCKET_NAME, Key: NFT_DATA_KEY }).promise();
        return data.Body ? JSON.parse(data.Body.toString("utf-8")) : [];
    } catch (error: any) {
        if (error.code === "NoSuchKey") {
            return []; // Если файл не существует, возвращаем пустой массив
        }
        console.error(`❌ Ошибка при получении данных из S3:`, error);
        throw error;
    }
};

// Запись данных в S3
const uploadToS3 = async (data: any) => {
    try {
        await s3.putObject({
            Bucket: AWS_BUCKET_NAME,
            Key: NFT_DATA_KEY,
            Body: JSON.stringify(data, null, 2),
            ContentType: "application/json",
        }).promise();
    } catch (error) {
        console.error(`❌ Ошибка при загрузке данных в S3:`, error);
        throw error;
    }
};

// Получение всех отслеживаемых NFT
export const getTrackedNFTs = async (): Promise<any[]> => {
    return await getDataFromS3();
};

// Добавление нового NFT
export const addTrackedNFTToS3 = async ({ owner_id, telegram_id, nft }: { owner_id: string; telegram_id: string; nft: any }) => {
    const data = await getTrackedNFTs();

    // Проверяем, существует ли уже пользователь с таким telegram_id
    let user = data.find((item: any) => item.telegram_id === telegram_id);

    if (user) {
        // Проверяем, существует ли уже этот NFT
        if (user.nfts.some((existingNFT: any) => existingNFT.nftAddress === nft.nftAddress)) {
            throw new Error(`NFT с адресом ${nft.nftAddress} уже отслеживается.`);
        }
        user.nfts.push(nft);
    } else {
        // Создаем нового пользователя
        data.push({
            owner_id,
            telegram_id,
            nfts: [nft],
        });
    }

    await uploadToS3(data);
    console.log(`✅ NFT ${nft.nftAddress} добавлен в отслеживание.`);
};

// Удаление NFT для пользователя
export const removeTrackedNFTFromS3 = async (telegramId: string, nftAddress: string) => {
    const data = await getTrackedNFTs();

    // Находим пользователя
    const user = data.find((item: any) => item.telegram_id === telegramId);
    if (!user) {
        throw new Error(`Пользователь с telegram_id ${telegramId} не найден.`);
    }

    // Удаляем NFT из списка
    user.nfts = user.nfts.filter((nft: any) => nft.nftAddress !== nftAddress);

    // Если у пользователя больше нет NFT, удаляем его из массива
    if (user.nfts.length === 0) {
        const index = data.indexOf(user);
        data.splice(index, 1);
    }

    await uploadToS3(data);
    console.log(`✅ NFT с адресом ${nftAddress} удален из отслеживания для пользователя ${telegramId}.`);
};
