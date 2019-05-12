/**
 * boolean => bool
 * bigint => uint<M> for 0 < M <= 256, M % 8 == 0
 * bigint => int<M> for 0 < M <= 256, M % 8 == 0
 * bigint => ufixed<M>x<N> for 8 <= M <= 256, M % 8 == 0 and 0 < N <= 80
 * bigint => fixed<M>x<N> for 8 <= M <= 256, M % 8 == 0 and 0 < N <= 80
 * number => uint<M> for 0 < M <= 48, M % 8 == 0
 * number => int<M> 0 < M <= 48, M % 8 == 0
 * string => string
 * Uint8Array(20) => address
 * Uint8Array(M) => bytes<M> for 0 < M <= 32
 * Uint8Array => bytes
 * Uint8Array => function
 * Array<type>(M) => <type>[M] for type is any type in this list
 * Array<type> => <type>[] for type is any type in this list
 * Array<type>(N) => (T1,T2,...,Tn) for T is any type in this list
 */
type ContractParameter = Uint8Array | bigint | number | boolean | string | ContractParameterArray
interface ContractParameterArray extends Array<ContractParameter> { }

export type MessageType = 'hello' | 'get_capabilities' | 'submit_native_token_transfer' | 'submit_contract_call' | 'submit_contract_deployment' | 'sign_message' | 'get_signer_address' | 'local_contract_call' | 'signer_address_changed'

export interface BaseMessage<T extends MessageType> { type: T }

export interface BaseRequest<T extends MessageType> extends BaseMessage<T> { correlation_id: string }

export interface BaseResponse<T extends MessageType> extends BaseMessage<T> { correlation_id: string }

export interface BaseEvent<T extends MessageType> extends BaseMessage<T> { }

export interface BaseSuccessResponse<T extends MessageType> extends BaseResponse<T> {
	success: true
}

export interface BaseFailureResponse<T extends MessageType> extends BaseResponse<T> {
	success: false
	error: {
		message: string
		data: unknown
	}
}

// Handshake Protocol
// The Hello message is the only request/response pair that is part of the Handshake protocol, everything else is part of the HotOstrich protocol.
// Messages for this protocol should be sent by broadcasting an 'EthereumHandshake-client' event to the window with the Request object in the 'data' property of the event.  Responses should be sent via the data property of an 'EthereumHandshake-provider' event.
//

export namespace Hello {
	export type Type = 'hello'
	export interface Protocol {
		name: string
		version: string
	}
	export interface Request extends BaseRequest<Type> { }
	export interface SuccessResponse extends BaseSuccessResponse<Type> {
		/** used to allow the application to communicate with a specific provider in the case when there are many available providers */
		provider_id: string
		/** the client must communicate with this provider using one of the protocols listed here */
		supported_protocols: Array<Protocol>
	}
	export interface FailureResponse extends BaseFailureResponse<Type> { }
	export type Response = SuccessResponse | FailureResponse
}

// HotOstritch Protocol
// Everything from here on down is part of the HotOstrich protocol.  You should only send these messages if the Hello message indicates that the HotOstrich protocol is supported by the provider.
// Messages sent from the client for this protocol should be sent by broadcasting an event to the window of type 'HotOstritch-client-<provider_id>'.
// Messages sent from the server for this protocol should be sent by broadcasting an event to the window of type 'HotOstritch-provider-<provider_id>'.
//

export namespace GetCapabilities {
	type Type = 'get_capabilities'
	export interface Request extends BaseRequest<Type> { }
	export interface SuccessResponse extends BaseSuccessResponse<Type> {
		capabilities: Array<'sign'|'call'|'submit'|'log_subscription'|'log_history'>
	}
	export interface FailureResponse extends BaseFailureResponse<Type> { }
	export type Response = SuccessResponse | FailureResponse
}

export namespace SubmitNativeTokenTransfer {
	type Type = 'submit_native_token_transfer'
	export interface Request extends BaseRequest<Type> {
		transaction: {
			/** 20 bytes long */
			to: Uint8Array
			/** 0 <= value < 2^256 */
			value: bigint
			/** 0 <= nonce <= 2^52; nonce % 1 == 0 */
			nonce?: number
			/** 0 <= gasPrice <= 2^256 */
			gasPrice?: bigint
			/** 0 <= gas <= 2^52; gasLimit % 1 == 0 */
			gasLimit?: number
			/** 0 <= chainId < 2^52; nonce % 1 == 0 */
			chainId?: number
		}
	}
	export interface SuccessResponse extends BaseSuccessResponse<Type> {
		confidence: number
	}
	export interface FailureResponse extends BaseFailureResponse<Type> {
		confidence: number
	}
	export type Response = SuccessResponse | FailureResponse
}

export namespace SubmitContractCall {
	type Type = 'submit_contract_call'
	export interface Request extends BaseRequest<Type> {
		transaction: {
			/** 20 bytes long */
			contract_address: Uint8Array
			/** ABI style: `myMethod(address,address[],uint256,(bool,bytes))` */
			method_signature: string
			method_parameters: Array<ContractParameter>
			/** 0 <= value < 2^256 */
			value: bigint
			/** 0 <= nonce <= 2^52; nonce % 1 == 0 */
			nonce?: number
			/** 0 <= gasPrice <= 2^256 */
			gasPrice?: bigint
			/** 0 <= gas <= 2^52; gasLimit % 1 == 0 */
			gasLimit?: number
			/** 0 <= chainId < 2^52; nonce % 1 == 0 */
			chainId?: number
		}
		/** Something like EIP 719 for presenting the user with a custom interface for transaction presentation. Validated by signer against contract or transaction details. */
		presentation_dsls: {
			[name: string]: unknown
		}
	}
	export interface SuccessResponse extends BaseSuccessResponse<Type> {
		confidence: number
	}
	export interface FailureResponse extends BaseFailureResponse<Type> {
		confidence: number
	}
	export type Response = SuccessResponse | FailureResponse
}

export namespace SubmitContractDeployment {
	type Type = 'submit_contract_deployment'
	export interface Request extends BaseRequest<Type> {
		transaction: {
			bytecode: Uint8Array
			/** ABI style: `myMethod(address,address[],uint256,(bool,bytes))` */
			constructor_signature: string
			constructor_parameters: Array<ContractParameter>
			/** 0 <= value < 2^256 */
			value: bigint
			/** 0 <= nonce <= 2^52; nonce % 1 == 0 */
			nonce?: number
			/** 0 <= gasPrice <= 2^256 */
			gasPrice?: bigint
			/** 0 <= gas <= 2^52; gasLimit % 1 == 0 */
			gasLimit?: number
			/** 0 <= chainId < 2^52; nonce % 1 == 0 */
			chainId?: number
		}
	}
	export interface SuccessResponse extends BaseSuccessResponse<Type> {
		confidence: number
	}
	export interface FailureResponse extends BaseFailureResponse<Type> {
		confidence: number
	}
	export type Response = SuccessResponse | FailureResponse
}

export namespace SignMessage {
	type Type = 'sign_message'
	export interface Request extends BaseRequest<Type> {
		message: string
	}
	export interface SuccessResponse extends BaseSuccessResponse<Type> {
		/** The message requested to be signed. */
		requested_message: string
		/** The message that was actually signed. */
		signed_message: string
		/** 32 bytes long.  The keccak256 of `signed_message`, which is what is really signed. */
		signed_bytes: Uint8Array
		/** The signature of the keccak256 of `signed_message` */
		signature: {
			/** 1 byte long */
			v: Uint8Array
			/** 32 bytes long */
			r: Uint8Array
			/** 32 bytes long */
			s: Uint8Array
		}
	}
	export interface FailureResponse extends BaseFailureResponse<Type> { }
	export type Response = SuccessResponse | FailureResponse
}

export namespace GetSignerAddress {
	type Type = 'get_signer_address'
	export interface Request extends BaseRequest<Type> {
		/** 20 bytes long */
		address: Uint8Array
	}
	export interface SuccessResponse extends BaseSuccessResponse<Type> { }
	export interface FailureResponse extends BaseFailureResponse<Type> { }
	export type Response = SuccessResponse | FailureResponse
}

export namespace LocalContractCall {
	type Type = 'local_contract_call'
	export interface Request extends BaseRequest<Type> {
		transaction: {
			/** 20 bytes long */
			contract_address: Uint8Array
			/** ABI style: `myMethod(address,address[],uint256,(bool,bytes))` */
			method_signature: string
			method_parameters: Array<ContractParameter>
			/** 0 <= value < 2^256 */
			value: bigint
			/** 20 bytes long */
			caller?: Uint8Array
			/** 0 <= gasPrice <= 2^256 */
			gasPrice?: bigint
			/** 0 <= gas <= 2^52; gasLimit % 1 == 0 */
			gasLimit?: number
		}
	}
	export interface SuccessResponse extends BaseSuccessResponse<Type> {
		/** ABI encoded method return data */
		result: Uint8Array
	}
	export interface FailureResponse extends BaseFailureResponse<Type> { }
	export type Response = SuccessResponse | FailureResponse
}

// export namespace FetchLogs {
// 	// TODO: this is for fetching old logs, use subscription for new logs
// 	// CONSIDER: results likely need to be paginated, is page size a client setting or server setting?
// }

// export namespace LogsSubscription {
// 	// CONSIDER: is a subscription just a request with many responses?
// 	// CONSIDER: is unsubscribing necessary?
// 	// CONSIDER: one response per log, or multiple logs per response?
// 	// CONSIDER: how are chain reorgs handled, just a message indicating removal or something more complex?
// }

// export namespace BlockSubscription {
// 	// CONSIDER: is this necessary?  why do people want to fetch a block for a dapp?  what information do they _really_ want?  What information do end-users care about?
// }

export interface SignerAddressChanged extends BaseEvent<'signer_address_changed'> {
	/** 20 bytes long */
	address: Uint8Array
}

export type HandshakeRequest = Hello.Request
export type HandshakeResponse = Hello.Response

export type HotOstrichRequest = GetCapabilities.Request | SubmitNativeTokenTransfer.Request | SubmitContractCall.Request | SubmitContractDeployment.Request | SignMessage.Request | GetSignerAddress.Request | LocalContractCall.Request
export type HotOstrichResponse = GetCapabilities.Response | SubmitNativeTokenTransfer.Response | SubmitContractCall.Response | SubmitContractDeployment.Response | SignMessage.Response | GetSignerAddress.Response | LocalContractCall.Response
export type HotOstrichEvents = SignerAddressChanged
export type Message = HandshakeRequest | HandshakeResponse | HotOstrichRequest | HotOstrichResponse | HotOstrichEvents

// if you get a compiler failure on this it most likely means you have a `MessageType` that doesn't have a `Message` with a matching `.type`
type EnsureSame<A, B> = [A] extends [B] ? ([B] extends [A] ? true : never) : never
{ const _: EnsureSame<MessageType, Message['type']> = true; _ }
