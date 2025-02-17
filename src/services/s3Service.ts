const AWS = require("aws-sdk");
import { AWS_ACCESS_KEY, AWS_SECRET_ACCESS_KEY, AWS_BUCKET_NAME, AWS_REGION } from "../config";
import { UserData, NFT } from "../types";

const s3 = new AWS.S3({
    accessKeyId: AWS_ACCESS_KEY,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
    region: AWS_REGION,
});

const NFT_DATA_KEY = "trackedNFTs/nftData.json";

export const uploadToS3 = async (data: any) => {
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

export const getTrackedNFTs = async (): Promise<UserData[]> => {
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

export const addTrackedNFTToS3 = async ({ owner_id, telegram_id, nft }: { owner_id: string; telegram_id: string; nft: NFT }) => {
    const data = await getTrackedNFTs();

    let user = data.find((item: UserData) => item.telegram_id === telegram_id);

    if (user) {
        if (user.nfts.some((existingNFT: NFT) => existingNFT.nftAddress === nft.nftAddress)) {
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
};

export const removeTrackedNFTFromS3 = async (telegramId: string, nftAddress: string) => {
  try {
    const data = await getTrackedNFTs();

    const user = data.find((item: UserData ) => item.telegram_id === telegramId);
    if (!user) {
      throw new Error(`У вас нет отслеживаемых NFT.`);
    }

    user.nfts = user.nfts.filter((nft: NFT) => nft.nftAddress !== nftAddress);

    if (user.nfts.length === 0) {
      const index = data.indexOf(user);
      data.splice(index, 1);
    }

    await uploadToS3(data);  
  } catch (error) {
    console.error('Ошибка при удалении NFT из S3:', error);
  }
};