import { JsonRpc } from '@zoltu/ethereum-types'
import { addressToChecksummedString } from '@zoltu/ethereum-crypto/output-node/ethereum'
import { toEth, toAttoeth } from '../utils'
import { createMemoryRpc } from './_globals'

export const sweepOwnerEther = async (rpc: JsonRpc, destination: bigint): Promise<void> => {
	const signerAddress = await rpc.coinbase()
	if (signerAddress === null) throw new Error(`coinbase is null`)
	const balanceAttoeth = await rpc.getBalance(signerAddress)
	const gasPriceAttoeth = await rpc.getGasPrice()
	const gasAttoeth = 21000n * gasPriceAttoeth
	const amountInAttoeth = balanceAttoeth - gasAttoeth
	console.log(`Sweeping ${amountInAttoeth} ETH to ${destination.toString(16)}`)
	await rpc.sendEth(destination, amountInAttoeth)
	console.log(`Sent ${amountInAttoeth} ETH to ${destination.toString(16)}`)
}

export const sendOwnerEther = async (rpc: JsonRpc, destination: bigint, amountInEth: number): Promise<void> => {
	const signerAddress = await rpc.coinbase()
	if (signerAddress === null) throw new Error(`coinbase is null`)
	console.log(`Sending ETH from signer (${signerAddress.toString(16)}) to ${destination.toString(16)}...`)
	await rpc.sendEth(destination, toAttoeth(amountInEth))
	console.log(`Sent ${amountInEth} ETH to ${destination.toString(16)} from owner`)
}

export const getEtherBalance = async (rpc: JsonRpc, address: bigint): Promise<number> => {
	const attoeth = await rpc.getBalance(address)
	const eth = toEth(attoeth)
	console.log(`Balance of ${address.toString(16)}: ${eth} ETH`)
	return eth
}

async function main(): Promise<void> {
	console.log(await addressToChecksummedString(await (await createMemoryRpc()).addressProvider()))
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
