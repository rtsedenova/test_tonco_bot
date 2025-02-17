export const SCALE_FACTOR = Math.pow(2, 96);

export interface PositionData {
  id: string;
  owner: string;
  pool: string;
  priceSqrt: bigint;
  nftAddress: string;
  tickLower: number;
  tickUpper: number;
  poolName: string;
}

export interface NFT {
  nftAddress: string;
  priceRange: { lower: number; upper: number };
  isInTheRange?: boolean;
}

export interface UserData {
  owner_id: string;
  telegram_id: string;
  nfts: NFT[];
}

export interface Callback {
  data: string;
}

export interface BotContext {
  telegram: {
    sendMessage: (chatId: string, message: string) => Promise<any>;
  };
}