import fetch from 'node-fetch'
import { createLedgerRpc } from './rpc-factories'
import { FriendlyRecoverableWallet } from './friendly-recoverable-wallet'
import { FetchJsonRpc } from '@zoltu/ethereum-fetch-json-rpc'

export async function getLedgerRecoverableWallet(jsonRpcHttpEndpoint: string, gasPrice: bigint, walletAddress: bigint, derivationPath?: string) {
	const rpc = await createLedgerRpc(jsonRpcHttpEndpoint, gasPrice, derivationPath)
	const wallet = FriendlyRecoverableWallet.create(rpc, walletAddress)
	console.log(`Signer: ${await wallet.getSignerString()}`)
	console.log(`Wallet: ${await wallet.getAddressString()}`)
	return wallet
}

export async function getViewingRecoverableWallet(jsonRpcHttpEndpoint: string, walletAddress: bigint) {
	const rpc = new FetchJsonRpc(jsonRpcHttpEndpoint, fetch, {})
	const wallet = FriendlyRecoverableWallet.create(rpc, walletAddress)
	console.log(`Wallet: ${await wallet.getAddressString()}`)
	return wallet
}
