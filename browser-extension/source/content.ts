/**
 * this script executed within the context of the active tab when the user clicks the plugin navbar button
*/

import { HandshakeRequest, Hello, GetCapabilities, BaseRequest, BaseResponse, MessageType } from './shared'

const HANDSHAKE_CLIENT_CHANNEL_NAME = 'EthereumHandshake-client'
const HANDSHAKE_PROVIDER_CHANNEL_NAME = 'EthereumHandshake-provider'

class HandshakeChannel {
	// private readonly pluginPort = browser.runtime.connect()
	public constructor() {
		window.addEventListener(HANDSHAKE_CLIENT_CHANNEL_NAME, this.handshakeRequest)
	}

	private readonly handshakeRequest = async (event: Event): Promise<void> => {
		try {
			if (!isCustomEvent<HandshakeRequest>(event)) throw new Error(`Expected a custom event over the '${HANDSHAKE_CLIENT_CHANNEL_NAME}' event channel, but received something else:\n${JSON.stringify(event)}`)
			const { detail: request } = event
			if (request.type !== 'hello' || typeof request.correlation_id !== 'string') throw new Error(`Expected a 'hello' request over the '${HANDSHAKE_CLIENT_CHANNEL_NAME}' event channel, but received something else:\n${JSON.stringify(request)}`)
			new ProviderChannel(request.correlation_id)
		} catch (error) {
			console.error(error)
			const response: Hello.FailureResponse = {
				type: 'hello',
				correlation_id: ((event as any || {}).details || {}).correlation_id || '',
				success: false,
				error: error,
			}
			window.dispatchEvent(new CustomEvent(HANDSHAKE_PROVIDER_CHANNEL_NAME, { detail: response }))
		}
	}
}

class ProviderChannel {
	private readonly providerId: string
	private get clientChannelName(): string { return `HotOstrich-client-${this.providerId}` }
	private get providerChannelName(): string { return `HotOstrich-provider-${this.providerId}`}

	public constructor(correlationId: string) {
		this.providerId = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString()
		const response: Hello.Response = {
			type: 'hello',
			correlation_id: correlationId,
			success: true,
			provider_id: this.providerId,
			supported_protocols: [{ name: 'HotOstrich', version: '1.0.0' }]
		}
		window.dispatchEvent(new CustomEvent(HANDSHAKE_PROVIDER_CHANNEL_NAME, { detail: response }))
		window.addEventListener(this.clientChannelName, this.hotOstrichRequest)
	}

	private readonly hotOstrichRequest = async (event: Event): Promise<void> => {
		try {
			if (!isCustomEvent(event)) throw new Error(`Expected a custom event over the '${this.clientChannelName}' event channel, but received something else:\n${JSON.stringify(event)}`)
			const { detail: request } = event
			if (!isRequest(request)) throw new Error(`Expected a request over the '${this.clientChannelName}' event channel, but received something else:\n${JSON.stringify(request)}`)
			const response = await this.processRequest(request)
			await this.sendResponse(response)
		} catch (error) {
			console.error(error)
		}
	}

	private readonly processRequest = async <T extends MessageType>(request: BaseRequest<T>): Promise<BaseResponse<MessageType>> => {
		if (isGetCapabilitiesRequest(request)) return await this.getCapabilitiesHandler(request)
		// TODO: figure out if we can get type checking that validates we have handled each of the types in MessageType
		throw new Error(`Unknown request type '${request.type}'\n${JSON.stringify(request)}`)
	}

	private readonly getCapabilitiesHandler = async (request: GetCapabilities.Request): Promise<GetCapabilities.Response> => {
		return {
			type: "get_capabilities",
			correlation_id: request.correlation_id,
			success: true,
			capabilities: ['sign','call']
		}
	}

	private readonly sendResponse = (response: BaseResponse<MessageType>): void => {
		const event = new CustomEvent(this.providerChannelName, { detail: response })
		window.dispatchEvent(event)
	}
}

if (!(window as any).recoverableWalletInjected) {
	(window as any).recoverableWalletInjected = true
	new HandshakeChannel()
}

console.log('content script attached')

const isCustomEvent = <T>(event: Event): event is CustomEvent<T> => 'detail' in event
const isRequest = (maybeRequest: any): maybeRequest is BaseRequest<MessageType> => 'type' in maybeRequest && 'correlation_id' in maybeRequest
const isGetCapabilitiesRequest = (maybeGetCapabilitiesRequest: BaseRequest<MessageType>): maybeGetCapabilitiesRequest is GetCapabilities.Request => maybeGetCapabilitiesRequest.type === 'get_capabilities'
