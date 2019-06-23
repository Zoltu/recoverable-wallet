import { Ledger } from './ledger'
import { FetchJsonRpc } from '@zoltu/ethereum-fetch-json-rpc'
import { Address, Bytes32, JsonRpc } from '@zoltu/ethereum-types'
import { toEth, toAttoeth } from './utils'
import { Signer } from './private-key-signer'
import { FriendlyRecoverableWalletFactory } from './recoverable-wallet-factory';
import fetch from 'node-fetch'

const chainId = 1
const jsonRpcHttpEndpoint = 'http://localhost:1235/'
// const jsonRpcHttpEndpoint = 'https://cloudflare-eth.com/'
const derivationPath = `m/44'/60'/0'/0/0`
const gasPrice = 1_001_000_000n

export const sweepOwnerEther = async (rpc: JsonRpc, destination: Address): Promise<void> => {
	rpc = await rpc
	destination = await destination
	const signerAddress = await rpc.coinbase()
	const balanceAttoeth = await rpc.getBalance(signerAddress)
	const gasPriceAttoeth = await rpc.getGasPrice()
	const gasAttoeth = 21000n * gasPriceAttoeth
	const amountInAttoeth = balanceAttoeth - gasAttoeth
	console.log(`Sweeping ${amountInAttoeth} ETH to ${destination.toString()}`)
	await rpc.sendEth(destination, amountInAttoeth)
	console.log(`Sent ${amountInAttoeth} ETH to ${destination.toString()}`)
}

export const sendOwnerEther = async (rpc: JsonRpc, destination: Address, amountInEth: number): Promise<void> => {
	destination = await destination
	rpc = await rpc
	const signerAddress = await rpc.coinbase()
	console.log(`Sending ETH from signer (${signerAddress.toString()}) to ${destination.toString()}...`)
	await rpc.sendEth(destination, toAttoeth(amountInEth))
	console.log(`Sent ${amountInEth} ETH to ${destination.toString()} from owner`)
}

export const getEtherBalance = async (rpc: JsonRpc, address: Address): Promise<number> => {
	address = await address
	rpc = await rpc
	const attoeth = await rpc.getBalance(address)
	const eth = toEth(attoeth)
	console.log(`Balance of ${address.toString()}: ${eth} ETH`)
	return eth
}

const createLedgerFetchRpc = async (): Promise<JsonRpc> => {
	const getGasPrice = async () => gasPrice
	const ledger = await Ledger.create(derivationPath)
	return new FetchJsonRpc(jsonRpcHttpEndpoint, fetch, getGasPrice, ledger.getAddress, ledger.signTransaction, chainId)
}
createLedgerFetchRpc

const createMemoryWalletFetchRpc = async (): Promise<JsonRpc> => {
	const getGasPrice = async () => gasPrice
	const signer = new Signer(Bytes32.fromHexString('fae42052f82bed612a724fec3632f325f377120592c75bb78adfcceae6470c5a'))
	const chainId = 4173
	return new FetchJsonRpc(jsonRpcHttpEndpoint, fetch, getGasPrice, async () => signer.address(), async x => signer.sign(x), chainId)
}

async function doStuff(): Promise<void> {
	const rpc = await createMemoryWalletFetchRpc()
	// const rpc = await createLedgerFetchRpc()
	const signerAddress = await rpc.coinbase()
	console.log(`Signer ETH Balance: ${await rpc.getBalance(signerAddress)}`)
	const factory = await FriendlyRecoverableWalletFactory.deploy(rpc)
	const smartWallet = await factory.createWallet()
	// const signerAddress = await rpc.getSignerAddress()

	// const liquidLongAddress = Address.fromHexString('2FCBaFb681a086103e3d97927d9cA9Af9f1EBD22')
	// const richAddress = Address.fromHexString('12475B855a2aeac5d07ec882c85F15D4D91af445')
	// await smartWallet.sendEther(richAddress, 80)

	const ownerBalanceBefore = toEth(await rpc.getBalance(signerAddress))
	const walletBalanceBefore = await smartWallet.getEthBalance()
	await sendOwnerEther(rpc, await smartWallet.getAddress(), 0.01)
	const ownerBalanceMiddle = toEth(await rpc.getBalance(signerAddress))
	const walletBalanceMiddle = await smartWallet.getEthBalance()
	console.log(`Owner: ${ownerBalanceBefore} => ${ownerBalanceMiddle}`)
	console.log(`Wallet: ${walletBalanceBefore} => ${walletBalanceMiddle}`)
	await smartWallet.sendEther(signerAddress, 0.01)
	const ownerBalanceAfter = toEth(await rpc.getBalance(signerAddress))
	const walletBalanceAfter = await smartWallet.getEthBalance()
	console.log(`Owner: ${ownerBalanceMiddle} => ${ownerBalanceAfter}`)
	console.log(`Wallet: ${walletBalanceMiddle} => ${walletBalanceAfter}`)
}

doStuff().catch(error => {
	console.error(error)
	process.exit(1)
})
