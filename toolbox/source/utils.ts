export const toAttoeth = (eth: number | bigint): bigint => typeof eth === 'bigint' ? eth * 10n**18n : BigInt(eth * 1e18)
export const toEth = (attoeth: bigint): number => Number(attoeth) / 1e18

export const sleep = async (milliseconds: number): Promise<void> => new Promise(resolve => setTimeout(resolve, milliseconds))

export function attoString(value: bigint): string {
	const integerPart = value / 10n**18n
	const fractionalPart = value % 10n**18n
	if (fractionalPart === 0n) {
		return integerPart.toString(10)
	} else {
		return `${integerPart.toString(10)}.${fractionalPart.toString(10).padStart(18, '0')}`
	}
}

export async function awaitUserInput() {
	const process = await import('process')
	process.stdin.setRawMode(true)
	return new Promise(resolve => process.stdin.once('data', () => {
		process.stdin.setRawMode(false)
		resolve()
	}))
}
