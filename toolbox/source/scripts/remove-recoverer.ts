import { getWallet } from './_globals';

const addressToRemove = 0n

async function main() {
	const wallet = await getWallet()
	await wallet.removeRecoveryAddress(addressToRemove)
}

if (require.main === module) {
	// necessary so @peculiar/webcrypto looks like browser WebCrypto, which @zoltu/ethereum-crypto needs
	import('@peculiar/webcrypto')
		.then(webcrypto => (globalThis as any).crypto = new webcrypto.Crypto())
		.then(main)
		.catch(error => {
			console.error(error)
			process.exit(1)
		})
}
