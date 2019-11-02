import { RecoverableWalletFactory, RecoverableWallet, RecoverableWalletFactoryDeployer, RecoverableWalletJsonRpc, RecoverableWalletJsonRpcMethod } from '@zoltu/recoverable-wallet-library';
import { DependenciesImpl } from './dependencies';
import { FriendlyRecoverableWallet } from './friendly-recoverable-wallet';
import { JsonRpc, RawTransactionReceipt } from '@zoltu/ethereum-types';

export class FriendlyRecoverableWalletFactory {
	public constructor(
		private readonly rpc: JsonRpc,
		private readonly factory: RecoverableWalletFactory,
	) { }

	static deploy = async (rpc: JsonRpc): Promise<FriendlyRecoverableWalletFactory> => {
		const dependencies = new DependenciesImpl(rpc)
		const signer = await rpc.coinbase()
		const deployerRemoteProcedureCall = async (method: RecoverableWalletJsonRpcMethod, params: Array<unknown>) => (await rpc.remoteProcedureCall({ jsonrpc: "2.0", id: null, method, params }) as { result: RawTransactionReceipt}).result
		const deployerRpc = new RecoverableWalletJsonRpc(deployerRemoteProcedureCall, `0x${signer.toString(16)}`, `0x${(await rpc.getGasPrice()).toString(16)}`)
		const recoverableWalletFactoryDeployer = new RecoverableWalletFactoryDeployer(deployerRpc)
		const recoverableWalletFactoryAddress = await recoverableWalletFactoryDeployer.ensureFactoryDeployed()
		const factory = new RecoverableWalletFactory(dependencies, recoverableWalletFactoryAddress)
		return new FriendlyRecoverableWalletFactory(rpc, factory)
	}

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
