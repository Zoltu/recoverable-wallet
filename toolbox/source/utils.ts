export const toAttoeth = (eth: number): bigint => BigInt(eth * 1e18)
export const toEth = (attoeth: bigint): number => Number(attoeth) / 1e18

export const sleep = async (milliseconds: number): Promise<void> => new Promise(resolve => setTimeout(resolve, milliseconds))
