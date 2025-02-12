import { getTrackedNFTs } from "../services/s3Service";  
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
      const telegramId = user.telegram_id; // Получаем telegram_id пользователя

      // Получаем price_sqrt для данного NFT
      const poolData = await getPoolAddressByNFT(nftAddress);
      if (poolData) {
        const priceSqrt = poolData.priceSqrt;

        // Преобразуем price_sqrt в цену с использованием SCALE_FACTOR
        const priceSqrtBigInt = BigInt(priceSqrt);
        const normalizedPriceSqrt = Number(priceSqrtBigInt) / SCALE_FACTOR;
        const price = normalizedPriceSqrt ** 2 * 1000;

        console.log(`NFT: ${nftAddress} | Normalized Price: ${price}`);

        // Проверяем, находится ли нормализованная цена в заданном диапазоне
        if (price >= priceRange.lower && price <= priceRange.upper) {
          console.log(`Цена ${price} в пределах диапазона: ${priceRange.lower} - ${priceRange.upper}`);
        } else {
          console.log(`Цена ${price} вне диапазона!`);

          // Отправляем сообщение пользователю, если цена вне диапазона
          await bot.telegram.sendMessage(telegramId, 
            `Тревога❗ Цена NFT с адресом ${nftAddress} вышла за пределы диапазона: ${priceRange.lower} - ${priceRange.upper}. Текущая цена: ${price}`
          );
        }
      } else {
        console.log(`Не удалось получить данные для ${nftAddress}`);
      }
    }
  }
};
