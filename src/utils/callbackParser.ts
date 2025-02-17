export function parseDeleteNFTCallback(callbackData: string): string | null {
    const match = callbackData.match(/^delete_nft_(.+)$/);
    return match ? match[1] : null;
  }
  