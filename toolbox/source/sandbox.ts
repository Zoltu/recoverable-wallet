import fetch from 'node-fetch'
import { Crypto } from '@peculiar/webcrypto'
import { JsonRpc } from '@zoltu/ethereum-types'
import { FetchJsonRpc } from '@zoltu/ethereum-fetch-json-rpc'
import { encodeMethod } from '@zoltu/ethereum-abi-encoder'
import { keccak256 } from '@zoltu/ethereum-crypto'
import { toEth, toAttoeth } from './utils'
import { Signer } from './private-key-signer'
import { FriendlyRecoverableWalletFactory } from './recoverable-wallet-factory';
import { Erc20 } from './erc20-token'
import { MnemonicSigner } from './mnemonic-signer'

// necessary so node crypto looks like web crypto, which @zoltu/ethereum-crypto needs
;(globalThis as any).crypto = new Crypto()

const jsonRpcHttpEndpoint = 'http://localhost:1235/'
// const jsonRpcHttpEndpoint = 'https://cloudflare-eth.com/'
const gasPrice = 1_001_000_000n

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

const createMemoryWalletFetchRpc = async (): Promise<JsonRpc> => {
	const signer = await Signer.create(0xfae42052f82bed612a724fec3632f325f377120592c75bb78adfcceae6470c5an)
	const gasPriceInAttoethProvider = async () => gasPrice
	const addressProvider = async () => signer.address
	const signatureProvider = signer.sign
	return new FetchJsonRpc(jsonRpcHttpEndpoint, fetch, { gasPriceInAttoethProvider, addressProvider, signatureProvider })
}
createMemoryWalletFetchRpc

const createMnemonicWalletFetchRpc = async (): Promise<JsonRpc> => {
	const signer = await MnemonicSigner.create('dirt enable exotic tumble female retreat catch devote hurt under place home'.split(' '))
	const gasPriceInAttoethProvider = async () => gasPrice
	const addressProvider = async () => signer.address
	const signatureProvider = signer.sign
	return new FetchJsonRpc(jsonRpcHttpEndpoint, fetch, { gasPriceInAttoethProvider, addressProvider, signatureProvider })
}
createMnemonicWalletFetchRpc

async function doStuff(): Promise<void> {
	const primaryRpc = await createMemoryWalletFetchRpc()
	const rpc = await createMnemonicWalletFetchRpc()
	const signerAddress = await rpc.coinbase()
	if (signerAddress === null) throw new Error(`coinbase is null`)
	console.log((await rpc.offChainContractCall({ to: 0xc66ea802717bfb9833400264dd12c2bceaa34a6dn, data: await encodeMethod(keccak256.hash, 'balanceOf(address)', [0x25dde46EC77A801ac887e7D1764B0c8913328348n]) })).toUnsignedBigint())
	await primaryRpc.sendEth(signerAddress, toAttoeth(1_000_000))
	// const rpc = await createLedgerFetchRpc()
	console.log(`Signer ETH Balance: ${toEth(await rpc.getBalance(signerAddress))}`)
	// we can only deploy the dependency contracts (e.g., RecoverableWalletFactory) from an unlocked account, so do one deploy with the unlockedRpc first
	await FriendlyRecoverableWalletFactory.deploy(primaryRpc)
	// then deploy with the account we actually want a wallet with
	const factory = await FriendlyRecoverableWalletFactory.deploy(rpc)
	const smartWallet = await factory.createWallet()

	const ownerBalanceBefore = toEth(await rpc.getBalance(signerAddress))
	const walletBalanceBefore = await smartWallet.getEthBalance()
	await sendOwnerEther(rpc, await smartWallet.getAddress(), 0.01)
	const ownerBalanceMiddle = toEth(await rpc.getBalance(signerAddress))
	const walletBalanceMiddle = await smartWallet.getEthBalance()
	console.log(`Owner: ${ownerBalanceBefore} => ${ownerBalanceMiddle}`)
	console.log(`Wallet: ${walletBalanceBefore} => ${walletBalanceMiddle}`)
	await smartWallet.sendEther(signerAddress, 0.005)
	const ownerBalanceAfter = toEth(await rpc.getBalance(signerAddress))
	const walletBalanceAfter = await smartWallet.getEthBalance()
	console.log(`Owner: ${ownerBalanceMiddle} => ${ownerBalanceAfter}`)
	console.log(`Wallet: ${walletBalanceMiddle} => ${walletBalanceAfter}`)

	// const tokenAddress = await smartWallet.deploy(Erc20.deploymentBytecode, 'constructor(address)', [await smartWallet.getAddress()])
	const tokenAddress = await Erc20.ensureDeployed(primaryRpc)
	await primaryRpc.onChainContractCall({to: tokenAddress, data: await encodeMethod(keccak256.hash, 'transfer(address,uint256)', [await smartWallet.getAddress(), 10n*10n**18n])})

	const walletTokenBalanceCallData = await encodeMethod(keccak256.hash, 'balanceOf(address)', [await smartWallet.getAddress()])
	const ownerTokenBalanceCallData = await encodeMethod(keccak256.hash, 'balanceOf(address)', [signerAddress])
	const walletTokenBalanceBefore = (await rpc.offChainContractCall({ to: tokenAddress, data: walletTokenBalanceCallData })).toUnsignedBigint()
	const ownerTokenBalanceBefore = (await rpc.offChainContractCall({ to: tokenAddress, data: ownerTokenBalanceCallData })).toUnsignedBigint()
	await smartWallet.sendToken(tokenAddress, signerAddress, 1)
	const walletTokenBalanceMiddle = (await rpc.offChainContractCall({ to: tokenAddress, data: walletTokenBalanceCallData })).toUnsignedBigint()
	const ownerTokenBalanceMiddle = (await rpc.offChainContractCall({ to: tokenAddress, data: ownerTokenBalanceCallData })).toUnsignedBigint()
	console.log(`Wallet TOK: ${toEth(walletTokenBalanceBefore)} => ${toEth(walletTokenBalanceMiddle)}`)
	console.log(`Owner TOK: ${toEth(ownerTokenBalanceBefore)} => ${toEth(ownerTokenBalanceMiddle)}`)
}

doStuff().catch(error => {
	console.error(error)
	process.exit(1)
})
