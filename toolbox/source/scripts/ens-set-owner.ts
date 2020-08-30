import { getWallet } from './_globals'
import { addressToChecksummedString } from '@zoltu/ethereum-crypto/output-node/ethereum'
import { hash } from 'eth-ens-namehash'
import { Bytes } from '@zoltu/ethereum-types'
import { keccak256 } from '@zoltu/ethereum-crypto'

const ensContractAddress = 0x00000000000C2E074eC69A0dFb2997BA6C7d2e1en
const ensBaseRegistryAddress = 0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85n
const ensName = 'recoverablewallet.eth'
const destinationAddress = 0x12475B855a2aeac5d07ec882c85F15D4D91af445n

async function main() {
	const wallet = await getWallet()
	const node = BigInt(hash(ensName))
	const baseRegistryLabel = ensName.split('.')[0]
	const baseRegistryLabelHash = await keccak256.hash(Bytes.fromStringLiteral(baseRegistryLabel))
	const currentRegistrant = Bytes.fromByteArray(await wallet.callContractLocal(ensBaseRegistryAddress, 0n, 'ownerOf(uint256 label)', baseRegistryLabelHash)).toUnsignedBigint()
	console.log(`Current Registrant of ${baseRegistryLabel}: ${await addressToChecksummedString(currentRegistrant)}`)
	const currentOwner = Bytes.fromByteArray(await wallet.callContractLocal(ensContractAddress, 0n, 'owner(bytes32)', node)).toUnsignedBigint()
	console.log(`Current Owner of ${ensName}: ${currentOwner.toString(16).padStart(40, '0')}`)
	if (currentRegistrant !== wallet.getAddress()) throw new Error(`Wallet is not the current registrant of ${ensName}`)
	if (currentOwner !== wallet.getAddress()) throw new Error(`Wallet is not the current owner of ${ensName}`)

	console.log(`Transferring ${ensName} (${node.toString(16).padStart(64, '0')}) from wallet (${await wallet.getAddressString()}) to ${await addressToChecksummedString(destinationAddress)}`)
	await wallet.callContract(ensBaseRegistryAddress, 0n, 'transferFrom(address _from, address _to, uint256 _tokenId)', wallet.getAddress(), destinationAddress, baseRegistryLabelHash)
	await wallet.callContract(ensContractAddress, 0n, 'setOwner(bytes32 node, address owner)', node, destinationAddress)
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
