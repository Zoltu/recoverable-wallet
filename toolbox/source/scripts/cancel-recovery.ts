import { jsonRpcHttpEndpoint, gasPrice, derivationPath, walletAddress } from './_constants';
import { getLedgerRecoverableWallet } from '../recoverable-wallet-factories';

async function doStuff() {
	const wallet = await getLedgerRecoverableWallet(jsonRpcHttpEndpoint, gasPrice, walletAddress, derivationPath)
	await wallet.cancelRecovery()
}

if (require.main === module) {
	// necessary so @peculiar/webcrypto looks like browser WebCrypto, which @zoltu/ethereum-crypto needs
	import('@peculiar/webcrypto')
		.then(webcrypto => (globalThis as any).crypto = new webcrypto.Crypto())
		.then(doStuff)
		.catch(error => {
			console.error(error)
			process.exit(1)
		})
}
