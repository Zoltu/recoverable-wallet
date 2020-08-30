import { getWallet } from './_globals';

const destination = 0x913dA4198E6bE1D5f5E4a40D0667f70C0B5430Ebn
const amountInEth = 1

async function main() {
	const wallet = await getWallet()
	await wallet.sendEther(destination, amountInEth)
	console.log('Sent!')
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
