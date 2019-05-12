import { Address, Bytes32 } from '@zoltu/recoverable-wallet-library'
import { Ledger } from './ledger'
import { FetchJsonRpc } from './fetch-json-rpc'
import { toEth, toAttoeth } from './utils'
import { Signer } from './private-key-signer'
import { FriendlyRecoverableWalletFactory } from './recoverable-wallet-factory';

export const sweepOwnerEther = async (rpc: FetchJsonRpc, destination: Address): Promise<void> => {
	rpc = await rpc
	destination = await destination
	const signerAddress = await rpc.getSignerAddress()
	const balanceAttoeth = await rpc.ethGetBalance(signerAddress)
	const gasPriceAttoeth = await rpc.getGasPriceInAttoeth()
	const gasAttoeth = 21000n * gasPriceAttoeth
	const amountInAttoeth = balanceAttoeth - gasAttoeth
	console.log(`Sweeping ${amountInAttoeth} ETH to ${destination.toString()}`)
	await rpc.submitTransaction({ from: signerAddress, to: destination, value: amountInAttoeth })
	console.log(`Sent ${amountInAttoeth} ETH to ${destination.toString()}`)
}

export const sendOwnerEther = async (rpc: FetchJsonRpc, destination: Address, amountInEth: number): Promise<void> => {
	destination = await destination
	rpc = await rpc
	const signerAddress = await rpc.getSignerAddress()
	console.log(`Sending ETH from signer (${signerAddress.toString()}) to ${destination.toString()}...`)
	await rpc.submitTransaction({ from: signerAddress, to: destination, value: toAttoeth(amountInEth) })
	console.log(`Sent ${amountInEth} ETH to ${destination.toString()} from owner`)
}

export const getEtherBalance = async (rpc: FetchJsonRpc, address: Address): Promise<number> => {
	address = await address
	rpc = await rpc
	const attoeth = await rpc.ethGetBalance(address)
	const eth = toEth(attoeth)
	console.log(`Balance of ${address.toString()}: ${eth} ETH`)
	return eth
}

const createLedgerFetchRpc = async (): Promise<FetchJsonRpc> => {
	const getGasPrice = async () => 2010000000n
	const ledger = await Ledger.create(`m/44'/60'/0'/0/0`)
	return new FetchJsonRpc('http://localhost:1235', ledger.signTransaction, ledger.getAddress, getGasPrice, 1)
}
createLedgerFetchRpc

const createMemoryWalletFetchRpc = async (): Promise<FetchJsonRpc> => {
	const getGasPrice = async () => 1n
	const signer = new Signer(Bytes32.fromHexString('fae42052f82bed612a724fec3632f325f377120592c75bb78adfcceae6470c5a'))
	const jsonRpcHttpEndpoint = 'http://localhost:1236'
	const chainId = 4173
	return new FetchJsonRpc(jsonRpcHttpEndpoint, async x => signer.sign(x), async () => signer.address(), getGasPrice, chainId)
}

async function doStuff(): Promise<void> {
	const rpc = await createMemoryWalletFetchRpc()
	// const rpc = await createLedgerFetchRpc()
	const signerAddress = await rpc.getSignerAddress()
	console.log(`Signer ETH Balance: ${await rpc.ethGetBalance(signerAddress)}`)
	const factory = await FriendlyRecoverableWalletFactory.create(rpc)
	const smartWallet = await factory.createWallet()
	// const signerAddress = await rpc.getSignerAddress()

	// const liquidLongAddress = Address.fromHexString('2FCBaFb681a086103e3d97927d9cA9Af9f1EBD22')
	// const richAddress = Address.fromHexString('12475B855a2aeac5d07ec882c85F15D4D91af445')
	// await smartWallet.sendEther(richAddress, 80)

	const ownerBalanceBefore = toEth(await rpc.ethGetBalance(signerAddress))
	const walletBalanceBefore = await smartWallet.getEthBalance()
	await sendOwnerEther(rpc, await smartWallet.getAddress(), 0.01)
	const ownerBalanceMiddle = toEth(await rpc.ethGetBalance(signerAddress))
	const walletBalanceMiddle = await smartWallet.getEthBalance()
	console.log(`Owner: ${ownerBalanceBefore} => ${ownerBalanceMiddle}`)
	console.log(`Wallet: ${walletBalanceBefore} => ${walletBalanceMiddle}`)
	await smartWallet.sendEther(signerAddress, 0.01)
	const ownerBalanceAfter = toEth(await rpc.ethGetBalance(signerAddress))
	const walletBalanceAfter = await smartWallet.getEthBalance()
	console.log(`Owner: ${ownerBalanceMiddle} => ${ownerBalanceAfter}`)
	console.log(`Wallet: ${walletBalanceMiddle} => ${walletBalanceAfter}`)
}

doStuff().catch(error => {
	console.error(error)
	process.exit(1)
})
