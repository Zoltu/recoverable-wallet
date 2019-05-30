import { Address, Bytes, Bytes32, EncodedEvent } from '@zoltu/recoverable-wallet-library'
import { hexStringToUnsignedBigint, unsignedBigintToUint8Array } from '@zoltu/bigint-helpers'
import { rlpEncode } from '@zoltu/rlp-encoder'
import { ErrorWithData } from './error-with-data'
import fetch from 'node-fetch'
import { sleep } from './utils';

export type JsonRpcMethod = 'eth_call' | 'eth_sendRawTransaction' | 'eth_estimateGas' | 'eth_getTransactionCount' | 'eth_getTransactionReceipt' | 'eth_getBalance' | 'eth_getCode' | 'eth_sendTransaction'

interface JsonRpcRequest {
	jsonrpc: '2.0'
	id: string | number | null
	method: JsonRpcMethod
	params?: Array<unknown>
}

interface JsonRpcSuccess {
	jsonrpc: '2.0'
	id: string | number | null
	result: unknown
}

interface JsonRpcError {
	jsonrpc: '2.0'
	id: string | number | null
	error: {
		code: number
		message: string
		data?: unknown
	}
}

interface RawTransactionReceipt {
	blockNumber: string | null | undefined,
	contractAddress: string | null,
	status: string,
	logs: Array<{ topics: Array<string>, data: string }>
}

interface TransactionReceipt {
	blockNumber: number | null
	contractAddress: Address | null
	events: Array<EncodedEvent>
	success: boolean
}

export interface TransactionLike {
	from?: Address
	to: Address | null
	data?: Bytes
	value?: bigint
	gasLimit?: number
	gasPrice?: bigint
	nonce?: number
	chainId?: number
}
export class OffChainTransaction implements TransactionLike {
	public constructor(
		public readonly from: Address,
		public readonly to: Address | null,
		public readonly gasPrice: bigint,
		public readonly value: bigint,
		public readonly data: Bytes,
	) { }

	public readonly wireEncode = (): { from: string, to: string | null, gasPrice: string, value: string, data: string } => Object.assign(
		{
			from: this.from.to0xString(),
			to: this.to,
			gasPrice: `0x${this.gasPrice.toString(16)}`,
			value: `0x${this.value.toString(16)}`,
			data: this.data.to0xString(),
		},
		this.to ? { to: this.to.to0xString() } : {},
	)
}
export class UnsignedTransaction implements TransactionLike {
	public readonly from: Address
	public readonly to: Address | null
	public readonly gasPrice: bigint
	public readonly value: bigint
	public readonly data: Bytes
	public constructor(
		offChainTransaction: OffChainTransaction,
		public readonly gas: number,
		public readonly nonce: number,
		public readonly chainId: number,
	) {
		this.from = offChainTransaction.from
		this.to = offChainTransaction.to
		this.gasPrice = offChainTransaction.gasPrice
		this.value = offChainTransaction.value
		this.data = offChainTransaction.data
	}
}
export class SignedTransaction implements TransactionLike {
	public readonly to: Address | null
	public readonly gas: number
	public readonly gasPrice: bigint
	public readonly value: bigint
	public readonly data: Bytes
	public readonly nonce: number
	public readonly chainId: number
	public constructor(
		unsignedTransaction: UnsignedTransaction,
		public readonly v: Bytes32,
		public readonly r: Bytes32,
		public readonly s: Bytes32,
	) {
		this.to = unsignedTransaction.to
		this.gas = unsignedTransaction.gas
		this.gasPrice = unsignedTransaction.gasPrice
		this.value = unsignedTransaction.value
		this.data = unsignedTransaction.data
		this.nonce = unsignedTransaction.nonce
		this.chainId = unsignedTransaction.chainId
	}
}

type JsonRpcResponse = JsonRpcSuccess | JsonRpcError

export class FetchJsonRpc {
	public constructor(
		private readonly jsonRpcEndpoint: string,
		private readonly sign: (bytes: Bytes, chainId?: number) => Promise<{ r: Bytes32, s: Bytes32, v: number }>,
		public readonly getSignerAddress: () => Promise<Address>,
		public readonly getGasPriceInAttoeth: () => Promise<bigint>,
		private readonly chainId: number,
	) { }

	public readonly submitTransaction = async (transaction: TransactionLike): Promise<TransactionReceipt> => {
		const gasEstimatingTransaction = new OffChainTransaction(
			transaction.from || await this.getSignerAddress(),
			transaction.to,
			transaction.gasPrice || await this.getGasPriceInAttoeth(),
			transaction.value || 0n,
			transaction.data || new Bytes(),
		)
		const unsignedTransaction = new UnsignedTransaction(
			gasEstimatingTransaction,
			transaction.gasLimit || await this.ethEstimateGas(gasEstimatingTransaction),
			transaction.nonce || await this.ethGetTransactionCount(),
			transaction.chainId || this.chainId,
		)
		const rlpEncodedUnsignedTransaction = this.rlpEncodeTransaction(unsignedTransaction)
		const signature = await this.sign(rlpEncodedUnsignedTransaction, unsignedTransaction.chainId)
		const signedTransaction = new SignedTransaction(
			unsignedTransaction,
			Bytes32.fromHexString(signature.v.toString(16).padStart(64, '0')),
			signature.r,
			signature.s,
		)
		const rlpEncodedSignedTransaction = this.rlpEncodeTransaction(signedTransaction)
		return await this.ethSendRawTransaction(rlpEncodedSignedTransaction)
	}

	public readonly deployContract = async (bytecode: Bytes, value?: bigint): Promise<Address> => {
		const receipt = await this.submitTransaction({ to: null, data: bytecode, value: value })
		if (receipt.success === false) throw new Error(`Contract deployment failed.  Transaction failed.`)
		if (receipt.contractAddress === null) throw new Error(`Contract deployment failed.  Contract address was null.`)
		return receipt.contractAddress
	}

	public readonly callTransaction = async (transaction: TransactionLike): Promise<Bytes> => {
		const offChainTransaction = new OffChainTransaction(
			transaction.from || await this.getSignerAddress(),
			transaction.to,
			transaction.gasPrice || await this.getGasPriceInAttoeth(),
			transaction.value || 0n,
			transaction.data || new Bytes(),
		)
		return await this.ethCall(offChainTransaction)
	}

	public readonly ethGetBalance = async (address: Address): Promise<bigint> => {
		const result = await this.remoteProcedureCall('eth_getBalance', [address.to0xString(), 'latest']) as string
		return hexStringToUnsignedBigint(result)
	}

	public readonly ethSendRawTransaction = async (signedTransaction: Bytes): Promise<TransactionReceipt> => {
		const transactionHashString = await this.remoteProcedureCall('eth_sendRawTransaction', [signedTransaction.to0xString()]) as string
		const transactionHash = Bytes32.fromHexString(transactionHashString)
		let receipt = await this.ethGetTransactionReceipt(transactionHash)
		while (receipt === null || receipt.blockNumber === null) {
			await sleep(1000)
			receipt = await this.ethGetTransactionReceipt(transactionHash)
		}
		if (!receipt.success) throw new Error(`Transaction mined, but failed.`)
		return receipt
	}

	public readonly ethGetTransactionReceipt = async (transactionHash: Bytes32): Promise<TransactionReceipt | null> => {
		const rawReceipt = await this.remoteProcedureCall('eth_getTransactionReceipt', [transactionHash.to0xString()]) as RawTransactionReceipt | null
		if (rawReceipt === null) return null
		return {
			blockNumber: rawReceipt.blockNumber ? Number.parseInt(rawReceipt.blockNumber, 16) : null,
			contractAddress: rawReceipt.contractAddress ? Address.fromHexString(rawReceipt.contractAddress) : null,
			events: rawReceipt.logs.map(rawLog => ({ data: Bytes.fromHexString(rawLog.data), topics: rawLog.topics.map(x => Bytes32.fromHexString(x)) })),
			success: (rawReceipt.status !== '0x0'),
		}
	}

	public readonly ethGetTransactionCount = async (): Promise<number> => {
		const address = await this.getSignerAddress()
		const result = await this.remoteProcedureCall('eth_getTransactionCount', [address.to0xString(), 'pending']) as string
		// this number will always be well below 2^52 and always be positive, so we can just parse it as a hex encoded unsigned number
		return Number.parseInt(result, 16)
	}

	public readonly ethEstimateGas = async (transaction: OffChainTransaction): Promise<number> => {
		const resultAsHexString = await this.remoteProcedureCall('eth_estimateGas', [transaction.wireEncode()]) as string
		// this number will always be well below 2^52 and always be positive, so we can just parse it as a hex encoded unsigned number
		return Number.parseInt(resultAsHexString, 16)
	}

	public readonly ethCall = async (transaction: OffChainTransaction): Promise<Bytes> => {
		const result = await this.remoteProcedureCall('eth_call', [transaction.wireEncode(), 'latest']) as string
		return Bytes.fromHexString(result)
	}

	public readonly remoteProcedureCall = async (method: JsonRpcMethod, params?: Array<unknown>): Promise<unknown> => {
		const requestBody: JsonRpcRequest = Object.assign({
			jsonrpc: '2.0' as '2.0',
			id: null,
			method: method,
		}, params ? { params: params } : {})
		const requestBodyJson = JSON.stringify(requestBody)
		const response = await fetch(this.jsonRpcEndpoint, { method: 'POST', body: requestBodyJson, headers: { 'Content-Type': 'application/json' } })
		if (!response.ok) {
			throw new ErrorWithData(`${response.status}: ${response.statusText}\n${response.body.read()}`, { 'request': requestBody })
		}
		const responseBody: JsonRpcResponse = await response.json()
		if ((<JsonRpcError>responseBody).error) throw new ErrorWithData((<JsonRpcError>responseBody).error.message, { 'request': requestBody })
		return (<JsonRpcSuccess>responseBody).result
	}

	private readonly rlpEncodeTransaction = (transaction: UnsignedTransaction | SignedTransaction): Bytes => {
		const toEncode = [
			stripZeros(unsignedBigintToUint8Array(BigInt(transaction.nonce), 48)),
			stripZeros(unsignedBigintToUint8Array(transaction.gasPrice, 256)),
			stripZeros(unsignedBigintToUint8Array(BigInt(transaction.gas), 48)),
			stripZeros(transaction.to || new Uint8Array(0)),
			stripZeros(unsignedBigintToUint8Array(transaction.value, 256)),
			transaction.data,
		]
		if (transaction instanceof UnsignedTransaction) {
			toEncode.push(stripZeros(unsignedBigintToUint8Array(BigInt(transaction.chainId), 48)))
			toEncode.push(stripZeros(new Uint8Array(0)))
			toEncode.push(stripZeros(new Uint8Array(0)))
		} else {
			toEncode.push(stripZeros(transaction.v))
			toEncode.push(stripZeros(transaction.r))
			toEncode.push(stripZeros(transaction.s))
		}
		return Bytes.fromByteArray(rlpEncode(toEncode))
	}
}

function stripZeros(byteArray: Uint8Array): Uint8Array {
	let i = 0;
	for (; i < byteArray.length; ++i) {
		if (byteArray[i] !== 0) break
	}
	return byteArray.subarray(i)
}
