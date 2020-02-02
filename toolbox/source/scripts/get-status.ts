import { addressToChecksummedString } from '@zoltu/ethereum-crypto/output-node/ethereum';
import { attoString } from '../utils';
import { getWallet } from './_globals';

async function main() {
	const wallet = await getWallet()

	console.log(`\x1b[32mOwner\x1b[0m: ${await wallet.getOwnerString()}`)

	const activeRecoveryDetails = await wallet.activeRecoveryDetails()
	if (activeRecoveryDetails.address !== 0n && activeRecoveryDetails.time !== 115792089237316195423570985008687907853269984665640564039457584007913129639935n) {
		console.log(`\x1b[32mActiver Recovery\x1b[0m: \x1b[35mAddress\x1b[0m: ${await addressToChecksummedString(activeRecoveryDetails.address)}; \x1b[35mTime\x1b[0m: ${new Date(Number(activeRecoveryDetails.time) * 1000).toISOString()}`)
	}

	const recoverers = await wallet.listRecoverers()
	for (const recoverer of recoverers) {
		console.log(`\x1b[32mRecoverer\x1b[0m: \x1b[35mAddress\x1b[0m: ${await addressToChecksummedString(recoverer.address)}; \x1b[35mDelay\x1b[0m: ${recoverer.delay}`)
	}

	console.log(`\x1b[32mETH\x1b[0m: ${attoString(await wallet.getAttoethBalance())}`)
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
