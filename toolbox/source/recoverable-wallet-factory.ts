import { Address, RecoverableWalletFactory, RecoverableWallet, RecoverableWalletFactoryDeployer, RecoverableWalletJsonRpc, RecoverableWalletJsonRpcMethod } from '@zoltu/recoverable-wallet-library';
import { FetchJsonRpc } from "./fetch-json-rpc";
import { DependenciesImpl } from './dependencies';
import { FriendlyRecoverableWallet } from './friendly-recoverable-wallet';

export class FriendlyRecoverableWalletFactory {
	public constructor(
		private readonly rpc: FetchJsonRpc,
		private readonly factory: RecoverableWalletFactory<bigint>,
	) { }

	static create = async (rpc: FetchJsonRpc): Promise<FriendlyRecoverableWalletFactory> => {
		const dependencies = new DependenciesImpl(rpc)
		const signer = await rpc.getSignerAddress()
		const deployerRemoteProcedureCall = async (method: RecoverableWalletJsonRpcMethod, params: Array<unknown>) => await rpc.remoteProcedureCall(method, params)
		const deployerRpc = new RecoverableWalletJsonRpc(deployerRemoteProcedureCall, signer.to0xString(), `0x${(await rpc.getGasPriceInAttoeth()).toString(16)}`)
		const recoverableWalletFactoryDeployer = new RecoverableWalletFactoryDeployer(deployerRpc)
		const recoverableWalletFactoryAddress = await recoverableWalletFactoryDeployer.ensureFactoryDeployed()
		const factory = new RecoverableWalletFactory(dependencies, Address.fromHexString(recoverableWalletFactoryAddress))
		return new FriendlyRecoverableWalletFactory(rpc, factory)
	}

	public readonly createWallet = async (): Promise<FriendlyRecoverableWallet> => {
		const events = await this.factory.create_wallet()
		const walletCreatedEvent = events.find(x => x.name === 'wallet_created') as RecoverableWalletFactory.wallet_created<bigint>
		if (walletCreatedEvent === undefined) throw new Error(`Expected wallet_created event.`)
		const walletAddress = walletCreatedEvent.parameters.wallet
		const dependencies = new DependenciesImpl(this.rpc)
		const recoverableWallet = new RecoverableWallet(dependencies, walletAddress)
		return new FriendlyRecoverableWallet(this.rpc, recoverableWallet)
	}
}
