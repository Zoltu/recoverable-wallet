export type SendAsync = (request: any, callback: (error: any, response: any) => void) => void

export interface EthereumProvider {
	sendAsync?: SendAsync
	selectedAddress?: string
}

declare global {
	interface Window {
		web3: { currentProvider: EthereumProvider }
		ethereum: EthereumProvider & { enable: () => Promise<void> }
		wrappedJSObject: Window
	}
}
