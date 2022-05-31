import { ethereum } from '@zoltu/ethereum-crypto'
import { gasPrice } from './_constants'
import { getWallet } from './_globals';
import { awaitUserInput, nanoString } from '../utils';

const destination = 0x913dA4198E6bE1D5f5E4a40D0667f70C0B5430Ebn
const amountInEth = 1

async function main() {
	const wallet = await getWallet()
	console.log(`Sending ${amountInEth} ETH from ${await wallet.getAddressString()} to ${await ethereum.addressToChecksummedString(destination)} with a gas price of ${nanoString(gasPrice)} nanoeth`)
	console.log(`Press enter to continue.`)
	await awaitUserInput()
	await wallet.sendEther(destination, amountInEth)
	console.log('Sent!')
	process.exit(1)
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
