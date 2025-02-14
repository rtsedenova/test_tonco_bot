import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { AWS_ACCESS_KEY, AWS_SECRET_ACCESS_KEY, AWS_BUCKET_NAME, AWS_REGION } from "../config";
import { Readable } from "stream";

const s3Client = new S3Client({
    credentials: {
        accessKeyId: AWS_ACCESS_KEY,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
    region: AWS_REGION,
});

const NFT_DATA_KEY = "trackedNFTs/nftData.json";

// Преобразование потока данных в строку
const streamToString = async (stream: Readable): Promise<string> => {
    return new Promise((resolve, reject) => {
        const chunks: Uint8Array[] = [];
        stream.on("data", (chunk) => chunks.push(chunk));
        stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
        stream.on("error", reject);
    });
};

// Запись данных в S3
const uploadToS3 = async (data: any) => {
    try {
        const command = new PutObjectCommand({
            Bucket: AWS_BUCKET_NAME,
            Key: NFT_DATA_KEY,
            Body: JSON.stringify(data, null, 2),
            ContentType: "application/json",
        });
        await s3Client.send(command);
        console.log("✅ Данные успешно загружены в S3");
    } catch (error) {
        console.error("❌ Ошибка при загрузке данных в S3:", error);
        throw error;
    }
};

// Получение всех отслеживаемых NFT
export const getTrackedNFTs = async (): Promise<any[]> => {
    try {
        const command = new GetObjectCommand({
            Bucket: AWS_BUCKET_NAME,
            Key: NFT_DATA_KEY,
        });
        const response = await s3Client.send(command);
        if (response.Body) {
            const bodyString = await streamToString(response.Body as Readable);
            return JSON.parse(bodyString);
        }
        return [];
    } catch (error: any) {
        if (error.name === "NoSuchKey") {
            return [];
        }
        console.error("❌ Ошибка при получении данных из S3:", error);
        throw error;
    }
};

// Добавление нового NFT
export const addTrackedNFTToS3 = async ({ owner_id, telegram_id, nft }: { owner_id: string; telegram_id: string; nft: any }) => {
    const data = await getTrackedNFTs();

    let user = data.find((item: any) => item.telegram_id === telegram_id);

    if (user) {
        if (user.nfts.some((existingNFT: any) => existingNFT.nftAddress === nft.nftAddress)) {
            throw new Error(`NFT с адресом ${nft.nftAddress} уже отслеживается.`);
        }
        user.nfts.push(nft);
    } else {
        data.push({
            owner_id,
            telegram_id,
            nfts: [nft],
        });
    }

    await uploadToS3(data);
    console.log(`✅ NFT ${nft.nftAddress} добавлен в отслеживание.`);
};

// Удаление NFT
export const removeTrackedNFTFromS3 = async (telegramId: string, nftAddress: string) => {
    try {
        const data = await getTrackedNFTs();

        const user = data.find((item: any) => item.telegram_id === telegramId);
        if (!user) {
            throw new Error(`У вас нет отслеживаемых NFT.`);
        }

        user.nfts = user.nfts.filter((nft: any) => nft.nftAddress !== nftAddress);

        if (user.nfts.length === 0) {
            const index = data.indexOf(user);
            data.splice(index, 1);
        }

        await uploadToS3(data);
        console.log(`✅ NFT с адресом ${nftAddress} удален из отслеживания.`);
    } catch (error) {
        console.error("Ошибка при удалении NFT из S3:", error);
    }
};
