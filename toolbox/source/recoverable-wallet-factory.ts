import { Address, RecoverableWalletFactory, RecoverableWallet, RecoverableWalletFactoryDeployer, RecoverableWalletJsonRpc, RecoverableWalletJsonRpcMethod } from '@zoltu/recoverable-wallet-library';
import { FetchJsonRpc } from "./fetch-json-rpc";
import { DependenciesImpl } from './dependencies';
import { FriendlyRecoverableWallet } from './friendly-recoverable-wallet';

export class FriendlyRecoverableWalletFactory {
	public constructor(
		private readonly factoryAddress: Address,
	) { }

	static create = async (rpc: FetchJsonRpc): Promise<FriendlyRecoverableWalletFactory> => {
		const signer = await rpc.getSignerAddress()
		const deployerRemoteProcedureCall = async (method: RecoverableWalletJsonRpcMethod, params: Array<unknown>) => await rpc.remoteProcedureCall(method, params)
		const deployerRpc = new RecoverableWalletJsonRpc(deployerRemoteProcedureCall, signer.to0xString(), `0x${(await rpc.getGasPriceInAttoeth()).toString(16)}`)
		const recoverableWalletFactoryDeployer = new RecoverableWalletFactoryDeployer(deployerRpc)
		const recoverableWalletFactoryAddress = await recoverableWalletFactoryDeployer.ensureFactoryDeployed()
		return new FriendlyRecoverableWalletFactory(Address.fromHexString(recoverableWalletFactoryAddress))
	}

	private readonly getFactory = (rpc: FetchJsonRpc): RecoverableWalletFactory<bigint> => {
		const dependencies = new DependenciesImpl(rpc)
		return new RecoverableWalletFactory(dependencies, this.factoryAddress)
	}

	public readonly createWallet = async (rpc: FetchJsonRpc): Promise<FriendlyRecoverableWallet> => {
		const events = await this.getFactory(rpc).createWallet(1)
		const walletCreatedEvent = events.find(x => x.name === 'WalletCreated') as RecoverableWalletFactory.WalletCreated<bigint>
		if (walletCreatedEvent === undefined) throw new Error(`Expected WalletCreated event.`)
		const ownerAddress = walletCreatedEvent.parameters.owner
		const walletAddress = await this.getFactory(rpc).getWalletFor_(ownerAddress)
		const dependencies = new DependenciesImpl(rpc)
		const recoverableWallet = new RecoverableWallet(dependencies, walletAddress)
		return new FriendlyRecoverableWallet(rpc, recoverableWallet)
	}
}
