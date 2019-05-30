import { RecoverableWallet, Address } from '@zoltu/recoverable-wallet-library'
import { FetchJsonRpc } from './fetch-json-rpc'
import { toAttoeth, toEth } from './utils';

export class FriendlyRecoverableWallet {
	public constructor(
		private readonly rpc: FetchJsonRpc,
		private readonly wallet: RecoverableWallet<bigint>
	) { }

	public readonly getAddress = async (): Promise<Address> => {
		return this.wallet.address
	}

	public readonly getAttoethBalance = async (): Promise<bigint> => {
		return await this.rpc.ethGetBalance(this.wallet.address)
	}

	public readonly getEthBalance = async (): Promise<number> => {
		const attoeth = await this.getAttoethBalance()
		return toEth(attoeth)
	}

	public readonly sendEther = async (destination: Address, amountInEth: number): Promise<void> => {
		await this.wallet.sendEther(destination, toAttoeth(amountInEth))
	}
}
