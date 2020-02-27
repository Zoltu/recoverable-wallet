import { SignerFetchRpc } from './rpc-factories'
import { RecoverableWallet, RecoverableWalletFactory, factoryAddress } from '@zoltu/recoverable-wallet-library'
import { DependenciesImpl } from './dependencies'

export function factoryFor(rpc: SignerFetchRpc): RecoverableWalletFactory {
	return new RecoverableWalletFactory(new DependenciesImpl(rpc), factoryAddress)
}

export async function walletFor(rpc: SignerFetchRpc): Promise<RecoverableWallet> {
	const creatorDependencies = new DependenciesImpl(rpc)
	const factory = new RecoverableWalletFactory(creatorDependencies, factoryAddress)
	const events = await factory.createWallet()
	const event = events.find(x => x.name === 'WalletCreated') as RecoverableWalletFactory.WalletCreated
	const walletAddress = event.parameters.wallet
	return new RecoverableWallet(new DependenciesImpl(rpc), walletAddress)
}

export async function createWalletView(wallet: RecoverableWallet, viewerRpc: SignerFetchRpc): Promise<RecoverableWallet> {
	return new RecoverableWallet(new DependenciesImpl(viewerRpc), wallet.address)
}
