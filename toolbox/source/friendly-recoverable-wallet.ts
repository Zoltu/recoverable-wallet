import { RecoverableWallet, Event } from '@zoltu/recoverable-wallet-library'
import { Bytes, JsonRpc } from '@zoltu/ethereum-types'
import { encodeMethod, EncodableArray, encodeParameters, parseSignature } from '@zoltu/ethereum-abi-encoder'
import { keccak256 } from '@zoltu/ethereum-crypto'
import { toAttoeth, toEth } from './utils';

export class FriendlyRecoverableWallet {
	public constructor(
		private readonly rpc: JsonRpc,
		private readonly wallet: RecoverableWallet
	) { }

	public readonly getAddress = async (): Promise<bigint> => this.wallet.address

	public readonly getAttoethBalance = async (): Promise<bigint> => await this.rpc.getBalance(this.wallet.address)

	public readonly getEthBalance = async (): Promise<number> => toEth(await this.getAttoethBalance())

	public readonly sendEther = async (destination: bigint, amountInEth: number): Promise<readonly Event[]> => await this.wallet.execute(destination, toAttoeth(amountInEth), new Bytes())

	public readonly sendToken = async (tokenAddress: bigint, destination: bigint, amountInFixedPoint: number): Promise<readonly Event[]> => {
		const data = await encodeMethod(keccak256.hash, 'transfer(address,uint256)', [destination, toAttoeth(amountInFixedPoint)])
		return await this.wallet.execute(tokenAddress, 0n, data)
	}

	public readonly deploy = async (deploymentBytecode: Bytes, constructorSignature: string, parameters: EncodableArray): Promise<bigint> => {
		const constructorDescription = parseSignature(constructorSignature)
		const encodedParameters = encodeParameters(constructorDescription.inputs, parameters)
		const data = new Uint8Array([...deploymentBytecode, ...encodedParameters])
		const address = await this.wallet.deploy_(0n, data, 0n)
		await this.wallet.deploy(0n, data, 0n)
		return address
	}
}
