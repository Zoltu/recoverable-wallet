// Type definitions for @ledgerhq/hw-app-eth 4.48.0
// Project: https://github.com/LedgerHQ/ledgerjs/tree/master/packages/hw-app-eth, https://github.com/ledgerhq/ledgerjs
// Definitions by: Micah Zoltu <https://github.com/MicahZoltu>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// TypeScript Version: 3.3

declare module '@ledgerhq/hw-app-eth' {
	/// <reference types = "node"/>
	import Transport from "@ledgerhq/hw-transport";

	class Eth {
		constructor(transport: Transport, scrambleKey?: string);
		getAddress(path: string, boolDisplay?: boolean, boolChaincode?: boolean): Promise<{ publicKey: string, address: string, chainCode?: string }>;
		provideERC20TokenInformation({ data }: { data: Buffer }): Promise<boolean>;
		signTransaction(path: string, rawTxHex: string): Promise<{ s: string, v: string, r: string }>;
		getAppConfiguration(): Promise<{ arbitraryDataEnabled: number, version: string }>;
		signPersonalMessage(path: string, messageHex: string): Promise<{ v: number, s: string, r: string }>;
	}

	export default Eth;
}
