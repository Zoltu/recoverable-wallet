import { getWallet } from './_globals';

async function main() {
	const wallet = await getWallet()
	await wallet.finishRecovery()
}

if (require.main === module) {
	// necessary so @peculiar/webcrypto looks like browser WebCrypto, which @zoltu/ethereum-crypto needs
	import('@peculiar/webcrypto')
		.then(webcrypto => (globalThis as any).crypto = new webcrypto.Crypto())
		.then(main)
		.catch(error => {
			console.dir(error, { colors: true, depth: null })
			process.exit(1)
		})
}
