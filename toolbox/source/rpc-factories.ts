import fetch from 'node-fetch'
import { LedgerSigner } from './ledger-signer'
import { FetchJsonRpc } from '@zoltu/ethereum-fetch-json-rpc'
import { MnemonicSigner } from './mnemonic-signer'
import { Signer } from './private-key-signer'

type PartiallyRequired<T, TKeys extends keyof T> = { [P in keyof T]: T[P] } & { [P in TKeys]-?: T[P] }
export type SignerFetchRpc = PartiallyRequired<FetchJsonRpc, 'addressProvider' | 'signatureProvider'>

export async function createLedgerRpc(jsonRpcHttpEndpoint: string, gasPrice: bigint, derivationPath?: string) {
	const signer = await LedgerSigner.create(derivationPath)
	const gasPriceInAttoethProvider = async () => gasPrice
	const addressProvider = signer.getAddress
	const signatureProvider = signer.sign
	return new FetchJsonRpc(jsonRpcHttpEndpoint, fetch, { gasPriceInAttoethProvider, addressProvider, signatureProvider }) as SignerFetchRpc
}

export async function createMnemonicRpc(jsonRpcHttpEndpoint: string, gasPrice: bigint) {
	// address: 0xfc2077CA7F403cBECA41B1B0F62D91B5EA631B5En
	const signer = await MnemonicSigner.create('zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo wrong'.split(' '))
	const gasPriceInAttoethProvider = async () => gasPrice
	const addressProvider = async () => signer.address
	const signatureProvider = signer.sign
	return new FetchJsonRpc(jsonRpcHttpEndpoint, fetch, { gasPriceInAttoethProvider, addressProvider, signatureProvider }) as SignerFetchRpc
}

export async function createMemoryRpc(jsonRpcHttpEndpoint: string, gasPrice: bigint) {
	// address: 0x913dA4198E6bE1D5f5E4a40D0667f70C0B5430Ebn
	const signer = await Signer.create(0xfae42052f82bed612a724fec3632f325f377120592c75bb78adfcceae6470c5an)
	const gasPriceInAttoethProvider = async () => gasPrice
	const addressProvider = async () => signer.address
	const signatureProvider = signer.sign
	return new FetchJsonRpc(jsonRpcHttpEndpoint, fetch, { gasPriceInAttoethProvider, addressProvider, signatureProvider }) as SignerFetchRpc
}
