export function sqrtPriceToNormalPrice(sqrtPrice: string | number | bigint, scaleFactor: number): number {
    const sqrtPriceBigInt = BigInt(sqrtPrice);
    return Number(sqrtPriceBigInt) / scaleFactor;
}