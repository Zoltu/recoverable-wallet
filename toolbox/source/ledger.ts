// https://github.com/LedgerHQ/ledgerjs/issues/332
import 'babel-polyfill'
import LedgerTransportNodeHid from '@ledgerhq/hw-transport-node-hid'
import LedgerEth from '@ledgerhq/hw-app-eth'
import { Address, Bytes32, Bytes, Bytes1 } from "@zoltu/ethereum-types";
import { Lock } from 'semaphore-async-await'

export class Ledger {
	private readonly lock = new Lock()
	constructor(
		private readonly ledger: LedgerEth,
		private readonly derivationPath: string
	) { }
	public static readonly create = async (derivationPath: string = `m/44'/60'/0'/0/0`): Promise<Ledger> => {
		const transport = await LedgerTransportNodeHid.create()
		return new Ledger(new LedgerEth(transport), derivationPath)
	}
	signTransaction = async (rlpEncodedTransaction: Bytes): Promise<{ r: Bytes32, s: Bytes32, v: Bytes1 }> => {
		try {
			await this.lock.acquire()
			const signature = await this.ledger.signTransaction(this.derivationPath, rlpEncodedTransaction.toString())
			return { r: Bytes32.fromHexString(signature.r), s: Bytes32.fromHexString(signature.s), v: Bytes1.fromHexString(signature.v) }
		} finally {
			this.lock.release()
		}
	}
	getAddress = async (): Promise<Address> => {
		try {
			await this.lock.acquire()
			const result = await this.ledger.getAddress(this.derivationPath)
			const address = result.address
			return Address.fromHexString(address)
		} finally {
			this.lock.release()
		}
	}
}
