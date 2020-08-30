import 'regenerator-runtime'
import Transport from "@ledgerhq/hw-transport";
import TransportNodeHid from '@ledgerhq/hw-transport-node-hid-singleton'
import AppEth from '@ledgerhq/hw-app-eth'
import { Bytes } from '@zoltu/ethereum-types'

export class LedgerSigner {
	private readonly app = new AppEth(this.transport)

	private constructor(
		private readonly derivationPath: string,
		private readonly transport: Transport
	) { }

	public static readonly create = async (derivationPath: string = `m/44'/60'/0'/0/0`) => {
		return new LedgerSigner(derivationPath, await TransportNodeHid.create())
	}

	public readonly getAddress = async (): Promise<bigint> => {
		const { address: hexEncodedAddress,  } = await this.app.getAddress(this.derivationPath)
		return BigInt(hexEncodedAddress)
	}

	public readonly sign = async (message: Bytes): Promise<{ r: bigint, s: bigint, yParity: 'even'|'odd' }> => {
		const {r: rHexString, s: sHexString, v: vHexString} = await this.app.signTransaction(this.derivationPath, message.toString())
		return {
			r: BigInt(`0x${rHexString}`),
			s: BigInt(`0x${sHexString}`),
			yParity: BigInt(`0x${vHexString}`) % 2n ? 'even' as const : 'odd' as const,
		}
	}
}
