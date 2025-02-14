const AWS = require("aws-sdk");
import { AWS_ACCESS_KEY, AWS_SECRET_ACCESS_KEY, AWS_BUCKET_NAME, AWS_REGION } from "../config";

const s3 = new AWS.S3({
    accessKeyId: AWS_ACCESS_KEY,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
    region: AWS_REGION,
});

const NFT_DATA_KEY = "trackedNFTs/nftData.json";

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
  try {
      const data = await s3.getObject({ Bucket: AWS_BUCKET_NAME, Key: NFT_DATA_KEY }).promise();
      return data.Body ? JSON.parse(data.Body.toString("utf-8")) : [];
  } catch (error: any) {
      if (error.code === "NoSuchKey") {
          return []; 
      }
      console.error(`❌ Ошибка при получении данных из S3:`, error);
      throw error;
  }
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

// Удаление NFT 
export const removeTrackedNFTFromS3 = async (telegramId: string, nftAddress: string) => {
  try {
    const data = await getTrackedNFTs();
    console.log('Текущие данные из S3:', data);

    // Находим пользователя
    const user = data.find((item: any) => item.telegram_id === telegramId);
    if (!user) {
      throw new Error(`У вас нет отслеживаемых NFT.`);
    }

    console.log(`Исходные данные пользователя:`, JSON.stringify(user));

    // Удаляем NFT из списка
    user.nfts = user.nfts.filter((nft: any) => nft.nftAddress !== nftAddress);
    console.log(`Новые данные пользователя:`, JSON.stringify(user.nfts));

    // Если у пользователя больше нет NFT, удаляем его из массива
    if (user.nfts.length === 0) {
      const index = data.indexOf(user);
      data.splice(index, 1);
    }

    await uploadToS3(data);  
    console.log(`✅ NFT с адресом ${nftAddress} удален из отслеживания.`);
  } catch (error) {
    console.error('Ошибка при удалении NFT из S3:', error);
  }
};