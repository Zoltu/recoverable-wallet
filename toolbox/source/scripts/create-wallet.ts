import { addressToChecksummedString } from '@zoltu/ethereum-crypto/output-node/ethereum'
import { FriendlyRecoverableWalletFactory } from '../recoverable-wallet-factory'
import { createRpc } from './_globals'

async function main() {
	const rpc = await createRpc()
	const factory = await FriendlyRecoverableWalletFactory.deploy(rpc)
	console.log(`\x1b[32mFactory Address\x1b[0m: ${await addressToChecksummedString(factory.address)}`)
	const wallet = await factory.createWallet()
	console.log(`\x1b[32mWallet Address\x1b[0m: ${await wallet.getAddressString()}`)
	console.log(`\x1b[32mOwner Address\x1b[0m: ${await wallet.getOwnerString()}`)
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
