import { UserData } from "../types";
import { InlineKeyboardButton } from "telegraf/typings/core/types/typegram";

export function generateNFTResponse(user: UserData): { nftList: string; buttons: InlineKeyboardButton[][] } {
  const nftList = user.nfts.map((nft, index) => `${index + 1}. ${nft.nftAddress}`).join("\n");
  const buttons: InlineKeyboardButton[][] = user.nfts.map((nft, index) => [
    {
      text: `[#${index + 1}]`,
      callback_data: `delete_nft_${nft.nftAddress}`,
    },
  ]);
  return { nftList, buttons };
}
