import { getTrackedNFTs, uploadToS3 } from "../services/s3Service";
import { getPoolAddressByNFT } from "../services/getPoolInfo";
import { sqrtPriceToNormalPrice } from "../utils/priceConversion";
import { BotContext, NFT, UserData } from "../types"; 
import { SCALE_FACTOR } from "../types/index";

export const trackNFTPrices = async (bot: BotContext) => {
  const trackedNFTs = await getTrackedNFTs(); 

  for (const user of trackedNFTs) {
    for (const nft of user.nfts) {
      const nftAddress = nft.nftAddress;
      const priceRange = nft.priceRange;
      const telegramId = user.telegram_id;

      const poolData = await getPoolAddressByNFT(nftAddress);
      if (poolData) {
        const priceSqrt = poolData.priceSqrt;

        const price = sqrtPriceToNormalPrice(priceSqrt, SCALE_FACTOR);

        const isInRange = price >= priceRange.lower && price <= priceRange.upper;
        const prevState = nft.isInTheRange; 

        if (isInRange !== prevState) {
          nft.isInTheRange = isInRange;

          if (isInRange) {
            await bot.telegram.sendMessage(telegramId, 
              `Цена NFT с адресом ${nftAddress} снова в пределах диапазона: ${priceRange.lower} - ${priceRange.upper}. Текущая цена: ${price}`
            );
          } else {
            await bot.telegram.sendMessage(telegramId, 
              `Тревога❗ Цена NFT с адресом ${nftAddress} вышла за пределы диапазона: ${priceRange.lower} - ${priceRange.upper}. Текущая цена: ${price}`
            );
          }

          await saveNFTData(user, nft);
        } 
      } else {
        await bot.telegram.sendMessage(telegramId, 
          `❌ Не удалось получить данные для NFT с адресом ${nftAddress}. Пожалуйста, попробуйте позже.`
        );
      }
    }
  }
};

const saveNFTData = async (user: UserData, nft: NFT) => {
  try {
    const data: UserData[] = await getTrackedNFTs();

    const userData = data.find((item: UserData) => item.telegram_id === user.telegram_id);
    if (userData) {
      const nftData = userData.nfts.find((item: NFT) => item.nftAddress === nft.nftAddress);
      if (nftData) {
        nftData.isInTheRange = nft.isInTheRange; 
      }
    }
    
    await uploadToS3(data);
  } catch (error) {
    console.error(`❌ Ошибка при сохранении данных в S3:`, error);
  }
};
