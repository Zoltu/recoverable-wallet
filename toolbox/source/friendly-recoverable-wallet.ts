import { RecoverableWallet } from '@zoltu/recoverable-wallet-library'
import { Address, Bytes, JsonRpc, AddressLike } from '@zoltu/ethereum-types'
import { toAttoeth, toEth } from './utils';

export class FriendlyRecoverableWallet {
	public constructor(
		private readonly rpc: JsonRpc,
		private readonly wallet: RecoverableWallet<bigint>
	) { }

	public readonly getAddress = async (): Promise<Address> => {
		return Address.fromHexString(this.wallet.address.toString())
	}

	public readonly getAttoethBalance = async (): Promise<bigint> => {
		return await this.rpc.getBalance(this.wallet.address as AddressLike)
	}

	public readonly getEthBalance = async (): Promise<number> => {
		const attoeth = await this.getAttoethBalance()
		return toEth(attoeth)
	}

	public readonly sendEther = async (destination: Address, amountInEth: number): Promise<void> => {
		await this.wallet.execute(destination, toAttoeth(amountInEth), new Bytes())
	}
}
