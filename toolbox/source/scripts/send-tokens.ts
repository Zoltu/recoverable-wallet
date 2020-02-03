import fetch from 'node-fetch'
import { jsonRpcHttpEndpoint } from './_constants';
import { FetchJsonRpc } from '@zoltu/ethereum-fetch-json-rpc';
import { encodeMethod, decodeParameters } from '@zoltu/ethereum-abi-encoder';
import { keccak256 } from '@zoltu/ethereum-crypto';
import { Bytes } from '@zoltu/ethereum-types';
import { getWallet } from './_globals';

const tokenAddress = 0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48n
const symbol = 'USDC'
const destination = 0n
const attoamount = 100n * 10n**6n

async function main() {
	// validate we have a token similar to what we expect
	const viewRpc = new FetchJsonRpc(jsonRpcHttpEndpoint, fetch, {})
	const onChainSymbolEncoded = await viewRpc.offChainContractCall({ to: tokenAddress, data: await encodeMethod(keccak256.hash, 'symbol()', []) })
	const onChainSymbol = new TextDecoder().decode((decodeParameters([{ name: 'symbol', type: 'bytes' }], onChainSymbolEncoded) as {symbol:Bytes}).symbol)
	if (onChainSymbol !== symbol) throw new Error(`Symbols don't match: ${onChainSymbol}`)

	const wallet = await getWallet()
	await wallet.sendToken(tokenAddress, destination, attoamount)
}

if (require.main === module) {
	// necessary so @peculiar/webcrypto looks like browser WebCrypto, which @zoltu/ethereum-crypto needs
	import('@peculiar/webcrypto')
		.then(webcrypto => (globalThis as any).crypto = new webcrypto.Crypto())
		.then(main)
		.catch(error => {
			console.error(error)
			process.exit(1)
		})
}
