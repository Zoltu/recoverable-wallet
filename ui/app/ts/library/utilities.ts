export async function sleep(milliseconds: number) {
	await new Promise(resolve => setTimeout(resolve, milliseconds))
}

export function bigintToDecimalString(value: bigint, power: bigint): string {
	const integerPart = value / 10n**power
	const fractionalPart = value % 10n**power
	if (fractionalPart === 0n) {
		return integerPart.toString(10)
	} else {
		return `${integerPart.toString(10)}.${fractionalPart.toString(10).padStart(Number(power), '0').replace(/0+$/, '')}`
	}
}

export function decimalStringToBigint(value: string, power: bigint): bigint {
	if (!/^\d*\.?\d*$/.test(value)) throw new Error(`Value is not a decimal string.`)
	let [integerPart, fractionalPart] = value.split('.')
	integerPart = integerPart.padStart(1, '0')
	fractionalPart = (fractionalPart || '').slice(0, Number(power)).padEnd(Number(power), '0')
	return BigInt(`${integerPart}${fractionalPart}`)
}
