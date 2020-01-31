declare module '@ledgerhq/hw-app-eth' {
	import Transport from '@ledgerhq/hw-transport'
	export default class AppEth {
		public constructor(transport: Transport)

		public getAddress(derivationPath: string, boolDisplay?: boolean, boolChaincode?: boolean): Promise<{publicKey: string, address: string, chainCode?: string}>
		public provideERC20TokenInformation(info: object): Promise<boolean>
		public signTransaction(derivationPath: string, hexEncodedTransaction: string): Promise<{s: string, v: string, r: string}>
		public getAppConfiguration(): Promise<{arbitraryDataEnabled: number, version: string}>
		public signPersonalMessage(derivationPath: string, hexEncodedMessage: string): Promise<{s: string, v: string, r: string}>
	}
}
