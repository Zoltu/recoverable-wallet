import { Address, Bytes32, RecoverableWallet } from '@zoltu/recoverable-wallet-library'
import { Ledger } from './ledger'
import { FetchJsonRpc } from './fetch-json-rpc'
import { toEth, toAttoeth } from './utils'
import { Signer } from './private-key-signer'
import { DependenciesImpl } from './dependencies';
import { FriendlyRecoverableWallet } from './friendly-recoverable-wallet';
import { FriendlyRecoverableWalletFactory } from './recoverable-wallet-factory';

const jsonRpcHttpEndpoint = 'https://cloudflare-eth.com'
const derivationPath = `m/44'/60'/0'/0/0`
const chainId = 1
const gasPriceAttoeth = 2010000000n

export const sweepEther = async (rpc: FetchJsonRpc, destination: Address): Promise<void> => {
	const signerAddress = await rpc.getSignerAddress()
	const balanceAttoeth = await rpc.ethGetBalance(signerAddress)
	const gasPriceAttoeth = await rpc.getGasPriceInAttoeth()
	const gasAttoeth = 21000n * gasPriceAttoeth
	const amountInAttoeth = balanceAttoeth - gasAttoeth
	console.log(`Sweeping ${amountInAttoeth} ETH to ${destination.toString()}`)
	await rpc.submitTransaction({ from: signerAddress, to: destination, value: amountInAttoeth })
	console.log(`Sent ${amountInAttoeth} ETH to ${destination.toString()}`)
}

export const sendEther = async (rpc: FetchJsonRpc, destination: Address, amountInEth: number): Promise<void> => {
	const signerAddress = await rpc.getSignerAddress()
	console.log(`Sending ETH from ${signerAddress.toString()} to ${destination.toString()}...`)
	await rpc.submitTransaction({ from: signerAddress, to: destination, value: toAttoeth(amountInEth) })
	console.log(`Sent ${amountInEth} ETH to ${destination.toString()} from ${signerAddress.toString()}`)
}

export const getEtherBalance = async (rpc: FetchJsonRpc, address: Address): Promise<number> => {
	const attoeth = await rpc.ethGetBalance(address)
	const eth = toEth(attoeth)
	console.log(`Balance of ${address.toString()}: ${eth} ETH`)
	return eth
}

const createLedgerFetchRpc = async (): Promise<FetchJsonRpc> => {
	const getGasPrice = async () => gasPriceAttoeth
	const ledger = await Ledger.create(derivationPath)
	return new FetchJsonRpc(jsonRpcHttpEndpoint, ledger.signTransaction, ledger.getAddress, getGasPrice, chainId)
}

const createMemoryWalletFetchRpc = async (): Promise<FetchJsonRpc> => {
	const getGasPrice = async () => 1n
	const signer = new Signer(Bytes32.fromHexString('fae42052f82bed612a724fec3632f325f377120592c75bb78adfcceae6470c5a'))
	return new FetchJsonRpc(jsonRpcHttpEndpoint, async (x, chainId) => signer.sign(x, chainId), async () => signer.address(), getGasPrice, chainId)
}

async function doStuff(): Promise<void> {
	const memoryRpc = await createMemoryWalletFetchRpc()
	const ledgerRpc = await createLedgerFetchRpc()
	const memoryAddress = await memoryRpc.getSignerAddress()
	const ledgerAddress = await ledgerRpc.getSignerAddress()
	await sendEther(memoryRpc, ledgerAddress, 0.01)

	const factory = await FriendlyRecoverableWalletFactory.create(memoryRpc)
	const smartWallet = await factory.createWallet(ledgerRpc)
	const walletAddress = await smartWallet.getAddress()
	// const dependencies = new DependenciesImpl(ledgerRpc)
	// const walletAddress = Address.fromHexString('')
	// const recoverableWallet = new RecoverableWallet(dependencies, walletAddress)
	// const smartWallet = new FriendlyRecoverableWallet(ledgerRpc, recoverableWallet)

	console.log(`Memory: ${memoryAddress.toString()}; ETH Balance: ${toEth(await memoryRpc.ethGetBalance(memoryAddress))}`)
	console.log(`Ledger: ${ledgerAddress.toString()}; ETH Balance: ${toEth(await ledgerRpc.ethGetBalance(ledgerAddress))}`)
	console.log(`Wallet: ${walletAddress.toString()}; ETH Balance: ${toEth(await memoryRpc.ethGetBalance(walletAddress))}`)

	await sendEther(memoryRpc, await smartWallet.getAddress(), 0.01)
	console.log(`Memory: ${memoryAddress.toString()}; ETH Balance: ${toEth(await memoryRpc.ethGetBalance(memoryAddress))}`)
	console.log(`Ledger: ${ledgerAddress.toString()}; ETH Balance: ${toEth(await ledgerRpc.ethGetBalance(ledgerAddress))}`)
	console.log(`Wallet: ${walletAddress.toString()}; ETH Balance: ${toEth(await memoryRpc.ethGetBalance(walletAddress))}`)
	await smartWallet.sendEther(memoryAddress, 0.01)
	console.log(`Memory: ${memoryAddress.toString()}; ETH Balance: ${toEth(await memoryRpc.ethGetBalance(memoryAddress))}`)
	console.log(`Ledger: ${ledgerAddress.toString()}; ETH Balance: ${toEth(await ledgerRpc.ethGetBalance(ledgerAddress))}`)
	console.log(`Wallet: ${walletAddress.toString()}; ETH Balance: ${toEth(await memoryRpc.ethGetBalance(walletAddress))}`)
}
doStuff

async function sendEthFromWallet(): Promise<void> {
	const amountInEth = 400

	const ledgerRpc = await createLedgerFetchRpc()
	const ledgerAddress = await ledgerRpc.getSignerAddress()
	const walletAddress = Address.fromHexString('')
	const hotAddress = Address.fromHexString('')
	console.log(`Ledger: ${ledgerAddress.toString()}; ETH Balance: ${toEth(await ledgerRpc.ethGetBalance(ledgerAddress))}`)
	console.log(`Wallet: ${walletAddress.toString()}; ETH Balance: ${toEth(await ledgerRpc.ethGetBalance(walletAddress))}`)
	console.log(`Hot   : ${   hotAddress.toString()}; ETH Balance: ${toEth(await ledgerRpc.ethGetBalance(   hotAddress))}`)
	const dependencies = new DependenciesImpl(ledgerRpc)
	const recoverableWallet = new RecoverableWallet(dependencies, walletAddress)
	const smartWallet = new FriendlyRecoverableWallet(ledgerRpc, recoverableWallet)

	await smartWallet.sendEther(hotAddress, amountInEth)

	console.log(`Ledger: ${ledgerAddress.toString()}; ETH Balance: ${toEth(await ledgerRpc.ethGetBalance(ledgerAddress))}`)
	console.log(`Wallet: ${walletAddress.toString()}; ETH Balance: ${toEth(await ledgerRpc.ethGetBalance(walletAddress))}`)
	console.log(`Hot   : ${   hotAddress.toString()}; ETH Balance: ${toEth(await ledgerRpc.ethGetBalance(   hotAddress))}`)
}
sendEthFromWallet

async function sweepEthToLedger(): Promise<void> {
	const ledgerRpc = await createLedgerFetchRpc()
	const ledgerAddress = await ledgerRpc.getSignerAddress()
	const hotAddress = Address.fromHexString('')
	console.log(`Ledger: ${ledgerAddress.toString()}; ETH Balance: ${toEth(await ledgerRpc.ethGetBalance(ledgerAddress))}`)
	console.log(`Wallet: ${   hotAddress.toString()}; ETH Balance: ${toEth(await ledgerRpc.ethGetBalance(   hotAddress))}`)

	await sweepEther(ledgerRpc, hotAddress)

	console.log(`Ledger: ${ledgerAddress.toString()}; ETH Balance: ${toEth(await ledgerRpc.ethGetBalance(ledgerAddress))}`)
	console.log(`Wallet: ${   hotAddress.toString()}; ETH Balance: ${toEth(await ledgerRpc.ethGetBalance(   hotAddress))}`)
}
sweepEthToLedger

sendEthFromWallet().catch(error => {
	console.error(error)
	process.exit(1)
})
