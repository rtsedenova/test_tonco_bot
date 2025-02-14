import { getTrackedNFTs, uploadToS3 } from "../services/s3Service";  
import { getPoolAddressByNFT } from "../services/getPoolInfo";  

const SCALE_FACTOR = Math.pow(2, 96);

interface BotContext {
  telegram: {
    sendMessage: (chatId: string, message: string) => Promise<any>;
  };
}

export const trackNFTPrices = async (bot: BotContext) => {
  const trackedNFTs = await getTrackedNFTs();  // Загружаем список отслеживаемых NFT

  for (const user of trackedNFTs) {
    for (const nft of user.nfts) {
      const nftAddress = nft.nftAddress;
      const priceRange = nft.priceRange;
      const telegramId = user.telegram_id; // Получаем telegram_id

      // Получаем price_sqrt для данного NFT
      const poolData = await getPoolAddressByNFT(nftAddress);
      if (poolData) {
        const priceSqrt = poolData.priceSqrt;

        // Преобразуем price_sqrt в цену
        const priceSqrtBigInt = BigInt(priceSqrt);
        const normalizedPriceSqrt = Number(priceSqrtBigInt) / SCALE_FACTOR;
        const price = normalizedPriceSqrt ** 2 * 1000;

        console.log(`NFT: ${nftAddress} | Normalized Price: ${price}`);

        // Проверяем, находится ли цена в заданном диапазоне
        const isInRange = price >= priceRange.lower && price <= priceRange.upper;
        const prevState = nft.isInTheRange; // Предыдущее состояние

        // Обновляем состояние isInTheRange в S3
        if (isInRange !== prevState) {
          nft.isInTheRange = isInRange;

          if (isInRange) {
            // Если цена в диапазоне
            console.log(`Цена ${price} в пределах диапазона: ${priceRange.lower} - ${priceRange.upper}`);
            await bot.telegram.sendMessage(telegramId, 
              `Цена NFT с адресом ${nftAddress} снова в пределах диапазона: ${priceRange.lower} - ${priceRange.upper}. Текущая цена: ${price}`
            );
          } else {
            // Если цена вне диапазона
            console.log(`Цена ${price} вне диапазона!`);
            await bot.telegram.sendMessage(telegramId, 
              `Тревога❗ Цена NFT с адресом ${nftAddress} вышла за пределы диапазона: ${priceRange.lower} - ${priceRange.upper}. Текущая цена: ${price}`
            );
          }

          // Сохраняем изменения в S3
          await saveNFTData(user, nft);  
        } else {
          console.log(`Цена ${price} осталась в прежнем состоянии.`);
        }
      } else {
        console.log(`Не удалось получить данные для ${nftAddress}`);
      }
    }
  }
};

const saveNFTData = async (user: any, nft: any) => {
  try {
    const data = await getTrackedNFTs();

    const userData = data.find((item: any) => item.telegram_id === user.telegram_id);
    if (userData) {
      const nftData = userData.nfts.find((item: any) => item.nftAddress === nft.nftAddress);
      if (nftData) {
        nftData.isInTheRange = nft.isInTheRange;  // Обновляем поле isInTheRange
      }
    }

    // Загружаем обновленные данные в S3
    await uploadToS3(data);
    console.log(`✅ Данные для NFT ${nft.nftAddress} обновлены.`);
  } catch (error) {
    console.error(`❌ Ошибка при сохранении данных в S3:`, error);
  }
};
