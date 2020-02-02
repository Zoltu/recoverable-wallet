/**
 * Convenience functions for easily changing the RPC for all scripts in one place.
 */

import * as RpcFactories from '../rpc-factories';
import * as WalletFactories from '../recoverable-wallet-factories'
import { jsonRpcHttpEndpoint, gasPrice, derivationPath, walletAddress } from './_constants';
import { addressToChecksummedString } from '@zoltu/ethereum-crypto/output-node/ethereum';

export async function createLedgerRpc() {
	return await RpcFactories.createLedgerRpc(jsonRpcHttpEndpoint, gasPrice, derivationPath)
}
export async function createMnemonicRpc() {
	return await RpcFactories.createMnemonicRpc(jsonRpcHttpEndpoint, gasPrice)
}
export async function createMemoryRpc() {
	return await RpcFactories.createMemoryRpc(jsonRpcHttpEndpoint, gasPrice)
}
export async function createRpc() {
	const rpc = await createMemoryRpc()
	console.log(`\x1b[32mRPC Signer\x1b[0m: ${await addressToChecksummedString(await rpc.addressProvider())}`)
	return rpc
}

export async function getLedgerWallet() {
	return await WalletFactories.getLedgerRecoverableWallet(jsonRpcHttpEndpoint, gasPrice, walletAddress, derivationPath)
}
export async function getMnemonicWallet() {
	return await WalletFactories.getMnemonicRecoverableWallet(jsonRpcHttpEndpoint, gasPrice, walletAddress)
}
export async function getMemoryWallet() {
	return await WalletFactories.getMemoryRecoverableWallet(jsonRpcHttpEndpoint, gasPrice, walletAddress)
}

export async function getWallet() {
	const wallet = await getMemoryWallet()
	console.log(`\x1b[32mWallet\x1b[0m: \x1b[35mSigner\x1b[0m: ${await wallet.getSignerString()}; \x1b[35mAddress\x1b[0m: ${await wallet.getAddressString()}`)
	return wallet
}
