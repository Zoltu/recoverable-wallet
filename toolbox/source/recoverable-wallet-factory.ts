import { RecoverableWalletFactory, RecoverableWallet, RecoverableWalletFactoryDeployer, RecoverableWalletJsonRpc, RecoverableWalletJsonRpcMethod } from '@zoltu/recoverable-wallet-library';
import { DependenciesImpl } from './dependencies';
import { FriendlyRecoverableWallet } from './friendly-recoverable-wallet';
import { JsonRpc, RawTransactionReceipt, RawOnChainTransaction, Bytes } from '@zoltu/ethereum-types';

export class FriendlyRecoverableWalletFactory {
	public constructor(
		private readonly rpc: JsonRpc,
		private readonly factory: RecoverableWalletFactory,
	) { }

	static deploy = async (rpc: JsonRpc): Promise<FriendlyRecoverableWalletFactory> => {
		const dependencies = new DependenciesImpl(rpc)
		const signer = await rpc.coinbase()
		if (signer === null) throw new Error(`coinbase is null`)
		const deployerRemoteProcedureCall = async <T extends RecoverableWalletJsonRpcMethod>(method: T, params: Array<unknown>) => {
			if (method === 'eth_sendTransaction') {
				const rawTransaction = params[0] as RawOnChainTransaction
				const transactionHash = await rpc.sendTransaction({
					from: BigInt(rawTransaction.from),
					to: rawTransaction.to !== null ? BigInt(rawTransaction.to) : null,
					data: Bytes.fromHexString(rawTransaction.data),
					value: BigInt(rawTransaction.value),
					gasLimit: BigInt(rawTransaction.gas),
					gasPrice: BigInt(rawTransaction.gasPrice),
					nonce: 0n,//BigInt(rawTransaction.nonce),
				})
				return `0x${transactionHash.toString(16).padStart(64,'0')}`
			} else {
				const response = await rpc.remoteProcedureCall({ jsonrpc: "2.0", id: null, method, params })
				return response.result as T extends 'eth_getTransactionReceipt' ? RawTransactionReceipt : string
			}
		}
		const deployerRpc = new RecoverableWalletJsonRpc(deployerRemoteProcedureCall, `0x${signer.toString(16)}`, `0x${(await rpc.getGasPrice()).toString(16)}`)
		const recoverableWalletFactoryDeployer = new RecoverableWalletFactoryDeployer(deployerRpc)
		const recoverableWalletFactoryAddress = await recoverableWalletFactoryDeployer.ensureFactoryDeployed()
		const factory = new RecoverableWalletFactory(dependencies, recoverableWalletFactoryAddress)
		return new FriendlyRecoverableWalletFactory(rpc, factory)
	}

	public get address() { return this.factory.address }

	public readonly createWallet = async (): Promise<FriendlyRecoverableWallet> => {
		const events = await this.factory.createWallet()
		const walletCreatedEvent = events.find(x => x.name === 'WalletCreated') as RecoverableWalletFactory.WalletCreated
		if (walletCreatedEvent === undefined) throw new Error(`Expected wallet_created event.`)
		const walletAddress = walletCreatedEvent.parameters.wallet
		const dependencies = new DependenciesImpl(this.rpc)
		const recoverableWallet = new RecoverableWallet(dependencies, walletAddress)
		return new FriendlyRecoverableWallet(this.rpc, recoverableWallet)
	}
}
