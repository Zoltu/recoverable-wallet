import fetch from 'node-fetch'
import { createLedgerRpc, SignerFetchRpc, createMnemonicRpc, createMemoryRpc } from './rpc-factories'
import { FriendlyRecoverableWallet } from './friendly-recoverable-wallet'
import { FetchJsonRpc } from '@zoltu/ethereum-fetch-json-rpc'

async function getRecoverableWallet(rpc: SignerFetchRpc, walletAddress: bigint) {
	return await FriendlyRecoverableWallet.create(rpc, walletAddress)
}

export async function getLedgerRecoverableWallet(jsonRpcHttpEndpoint: string, gasPrice: bigint, walletAddress: bigint, derivationPath?: string) {
	const rpc = await createLedgerRpc(jsonRpcHttpEndpoint, gasPrice, derivationPath)
	return getRecoverableWallet(rpc, walletAddress)
}

export async function getMnemonicRecoverableWallet(jsonRpcHttpEndpoint: string, gasPrice: bigint, walletAddress: bigint) {
	const rpc = await createMnemonicRpc(jsonRpcHttpEndpoint, gasPrice)
	return getRecoverableWallet(rpc, walletAddress)
}

export async function getMemoryRecoverableWallet(jsonRpcHttpEndpoint: string, gasPrice: bigint, walletAddress: bigint) {
	const rpc = await createMemoryRpc(jsonRpcHttpEndpoint, gasPrice)
	return getRecoverableWallet(rpc, walletAddress)
}

export async function getViewingRecoverableWallet(jsonRpcHttpEndpoint: string, walletAddress: bigint) {
	const rpc = new FetchJsonRpc(jsonRpcHttpEndpoint, fetch, {})
	const wallet = await FriendlyRecoverableWallet.create(rpc, walletAddress)
	console.log(`Wallet: ${await wallet.getAddressString()}`)
	return wallet
}
