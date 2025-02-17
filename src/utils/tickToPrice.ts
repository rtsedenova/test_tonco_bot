export function tickToPrice(tick: number): number {
    return Math.pow(1.0001, tick) * 1000;
}