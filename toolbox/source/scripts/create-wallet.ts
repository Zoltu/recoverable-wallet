import { FriendlyRecoverableWalletFactory } from '../recoverable-wallet-factory';
import { createLedgerRpc } from '../rpc-factories';
import { addressToChecksummedString } from '@zoltu/ethereum-crypto/output-node/ethereum';
import { jsonRpcHttpEndpoint, gasPrice, derivationPath } from './_constants';

async function doStuff() {
	const rpc = await createLedgerRpc(jsonRpcHttpEndpoint, gasPrice, derivationPath)
	const factory = await FriendlyRecoverableWalletFactory.deploy(rpc)
	const wallet = await factory.createWallet()
	console.log(`New wallet created for ${addressToChecksummedString(await rpc.addressProvider!())} at ${addressToChecksummedString(await wallet.getAddress())}`)
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
