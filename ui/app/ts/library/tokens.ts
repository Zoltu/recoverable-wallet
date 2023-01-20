import { ObjectTupleToValueArray, ObjectUnionToKeyedObjectUnion, UnionToIntersection } from "./types.js"

export const tokensArray = [
	{ symbol: 'WETH', address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', decimals: 18n },
	{ symbol: 'RAI', address: '0x03ab458634910AaD20eF5f1C8ee96F1D6ac54919', decimals: 18n },
	{ symbol: 'USDC', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6n },
] as const

const nameKeyed = {} as Record<typeof tokensArray[number]['symbol'], typeof tokensArray[number]>
const addressKeyed = {} as Record<typeof tokensArray[number]['address'], typeof tokensArray[number]>

for (const entry of tokensArray) {
	if (nameKeyed[entry.symbol] !== undefined) throw new Error(`Duplicate token name found.`)
	if (addressKeyed[entry.address] !== undefined) throw new Error(`Duplicate token address found.`)
	nameKeyed[entry.symbol] = entry
	addressKeyed[entry.address] = entry
}

export const tokenSymbols = tokensArray.map(x => x.symbol) as unknown as ObjectTupleToValueArray<typeof tokensArray, 'symbol'>
export const tokensByName = nameKeyed as UnionToIntersection<ObjectUnionToKeyedObjectUnion<typeof tokensArray[number], 'symbol'>>
export const tokensByAddress = addressKeyed as UnionToIntersection<ObjectUnionToKeyedObjectUnion<typeof tokensArray[number], 'address'>>
export type TOKENS = keyof typeof tokensByName
