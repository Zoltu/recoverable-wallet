import fetch from 'node-fetch'
import { FetchJsonRpc } from '@zoltu/ethereum-fetch-json-rpc'
import { RecoverableWalletJsonRpcMethod, RecoverableWalletJsonRpc } from '@zoltu/recoverable-wallet-library'
import { RawOnChainTransaction, Bytes, RawTransactionReceipt } from '@zoltu/ethereum-types'
import { MnemonicSigner, PrivateKeySigner } from './signers'

type NonUndefined<T> = T extends undefined ? never : T
type PartiallyRequired<T, TKeys extends keyof T> = { [P in keyof T]: T[P] } & { [P in TKeys]-?: NonUndefined<T[P]> }
export type SignerFetchRpc = PartiallyRequired<FetchJsonRpc, 'addressProvider' | 'signatureProvider'>

export async function createMnemonicRpc(jsonRpcHttpEndpoint: string, gasPrice: bigint, index?: number) {
	// address 0: 0xfc2077CA7F403cBECA41B1B0F62D91B5EA631B5E
	// address 1: 0xd1a7451beB6FE0326b4B78e3909310880B781d66
	// address 2: 0x578270B5E5B53336baC354756b763b309eCA90Ef
	const signer = await MnemonicSigner.create('zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo wrong'.split(' '), index)
	const gasPriceInAttoethProvider = async () => gasPrice
	const addressProvider = async () => signer.address
	const signatureProvider = signer.sign
	return new FetchJsonRpc(jsonRpcHttpEndpoint, fetch, { gasPriceInAttoethProvider, addressProvider, signatureProvider }) as SignerFetchRpc
}

export async function createMemoryRpc(jsonRpcHttpEndpoint: string, gasPrice: bigint) {
	// address: 0x913dA4198E6bE1D5f5E4a40D0667f70C0B5430Ebn
	const signer = await PrivateKeySigner.create(0xfae42052f82bed612a724fec3632f325f377120592c75bb78adfcceae6470c5an)
	const gasPriceInAttoethProvider = async () => gasPrice
	const addressProvider = async () => signer.address
	const signatureProvider = signer.sign
	return new FetchJsonRpc(jsonRpcHttpEndpoint, fetch, { gasPriceInAttoethProvider, addressProvider, signatureProvider }) as SignerFetchRpc
}

export async function createDeployerRpc(rpc: SignerFetchRpc) {
	const deployerRpc = async <T extends RecoverableWalletJsonRpcMethod>(method: T, params: Array<unknown>) => {
		if (method === 'eth_sendTransaction') {
			const rawTransaction = params[0] as RawOnChainTransaction
			const transactionHash = await rpc.sendTransaction({
				from: BigInt(rawTransaction.from),
				to: rawTransaction.to !== null ? BigInt(rawTransaction.to) : null,
				data: Bytes.fromHexString(rawTransaction.data),
				value: BigInt(rawTransaction.value),
				gasLimit: BigInt(rawTransaction.gas),
				gasPrice: BigInt(rawTransaction.gasPrice),
				nonce: 0n,//BigInt(rawTransaction.nonce),
			})
			return `0x${transactionHash.toString(16).padStart(64,'0')}`
		} else {
			const response = await rpc.remoteProcedureCall({ jsonrpc: "2.0", id: 0, method, params })
			return response.result as T extends 'eth_getTransactionReceipt' ? RawTransactionReceipt : string
		}
	}
	return new RecoverableWalletJsonRpc(deployerRpc, `0x${(await rpc.coinbase())!.toString(16).padStart(40, '0')}`, `0x${(await rpc.getGasPrice()).toString(16)}`)
}
