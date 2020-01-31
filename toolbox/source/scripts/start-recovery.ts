import { getLedgerRecoverableWallet } from '../recoverable-wallet-factories';
import { jsonRpcHttpEndpoint, gasPrice, walletAddress, derivationPath } from './_constants';


async function doStuff() {
	const wallet = await getLedgerRecoverableWallet(jsonRpcHttpEndpoint, gasPrice, walletAddress, derivationPath)
	await wallet.startRecovery()
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
