import fetch from 'node-fetch'
import { LedgerSigner } from './ledger-signer'
import { FetchJsonRpc } from '@zoltu/ethereum-fetch-json-rpc'
import { MnemonicSigner } from './mnemonic-signer'
import { Signer } from './private-key-signer'

export async function createLedgerRpc(jsonRpcHttpEndpoint: string, gasPrice: bigint, derivationPath?: string) {
	const signer = await LedgerSigner.create(derivationPath)
	const gasPriceInAttoethProvider = async () => gasPrice
	const addressProvider = signer.getAddress
	const signatureProvider = signer.sign
	return new FetchJsonRpc(jsonRpcHttpEndpoint, fetch, { gasPriceInAttoethProvider, addressProvider, signatureProvider }) as PartiallyRequired<FetchJsonRpc, 'addressProvider' | 'signatureProvider'>
}

export async function createMnemonicRpc(jsonRpcHttpEndpoint: string, gasPrice: bigint) {
	const signer = await MnemonicSigner.create('dirt enable exotic tumble female retreat catch devote hurt under place home'.split(' '))
	const gasPriceInAttoethProvider = async () => gasPrice
	const addressProvider = async () => signer.address
	const signatureProvider = signer.sign
	return new FetchJsonRpc(jsonRpcHttpEndpoint, fetch, { gasPriceInAttoethProvider, addressProvider, signatureProvider })
}

export async function createMemoryRpc(jsonRpcHttpEndpoint: string, gasPrice: bigint) {
	const signer = await Signer.create(0xfae42052f82bed612a724fec3632f325f377120592c75bb78adfcceae6470c5an)
	const gasPriceInAttoethProvider = async () => gasPrice
	const addressProvider = async () => signer.address
	const signatureProvider = signer.sign
	return new FetchJsonRpc(jsonRpcHttpEndpoint, fetch, { gasPriceInAttoethProvider, addressProvider, signatureProvider })
}

type PartiallyRequired<T, TKeys extends keyof T> = { [P in keyof T]: T[P] } & { [P in TKeys]-?: T[P] }
