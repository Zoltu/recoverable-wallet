import { stdin } from 'process'
import { getLedgerRecoverableWallet, getViewingRecoverableWallet } from '../recoverable-wallet-factories';
import { derivationPath, jsonRpcHttpEndpoint, gasPrice, walletAddress } from './_constants';
import { addressToChecksummedString } from '@zoltu/ethereum-crypto/output-node/ethereum';

const recipient = 0n

async function doStuff() {
	const viewingWallet = await getViewingRecoverableWallet(jsonRpcHttpEndpoint, walletAddress)
	console.log(`Attach device associated with ${await viewingWallet.getOwnerString()} and press any key...`)
	await awaitUserInput()

	const prevOwnerWallet = await getLedgerRecoverableWallet(jsonRpcHttpEndpoint, gasPrice, walletAddress, derivationPath)
	await prevOwnerWallet.startOwnershipTransfer(recipient)
	console.log(`Attach device associated with ${await addressToChecksummedString(recipient)} and press any key...`)
	await awaitUserInput()

	const newOwnerWallet = await getLedgerRecoverableWallet(jsonRpcHttpEndpoint, gasPrice, walletAddress, derivationPath)
	await newOwnerWallet.acceptOwnership()
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

async function awaitUserInput() {
	stdin.setRawMode(true)
	return new Promise(resolve => stdin.once('data', () => {
		stdin.setRawMode(false)
		resolve()
	}))
}
