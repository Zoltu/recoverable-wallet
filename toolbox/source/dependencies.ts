import { JsonRpc } from '@zoltu/ethereum-types'
import { encodeMethod } from '@zoltu/ethereum-abi-encoder'
import { keccak256 } from '@zoltu/ethereum-crypto'
import { Dependencies, EncodableArray, TransactionReceipt } from '@zoltu/recoverable-wallet-library'

export class DependenciesImpl implements Dependencies {
	public constructor(private readonly rpc: JsonRpc, public callFrom: bigint = 0n) { }

	public readonly call = async (to: bigint, methodSignature: string, methodParameters: EncodableArray, value: bigint): Promise<Uint8Array> => {
		const data = await encodeMethod(keccak256.hash, methodSignature, methodParameters)
		return await this.rpc.offChainContractCall({ to, data, value, from: this.callFrom })
	}
	public readonly submitTransaction = async (to: bigint, methodSignature: string, methodParameters: EncodableArray, value: bigint): Promise<TransactionReceipt> => {
		const data = await encodeMethod(keccak256.hash, methodSignature, methodParameters)
		return await this.rpc.onChainContractCall({ to, data, value })
	}
}
