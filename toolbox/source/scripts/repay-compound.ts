import { addressToChecksummedString } from '@zoltu/ethereum-crypto/output-node/ethereum'
import { attoString, toAttoeth } from '../utils'
import { getWallet } from './_globals'

const cEther = 0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5n
const cEtherRepayHelper = 0xf859A1AD94BcF445A406B892eF0d3082f4174088n
// const cUsdc = 0x39AA39c021dfbaE8faC545936693aC917d5E7563n
// const usdc = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48n
const amountToRepayPlusPadding = toAttoeth(1)
const borrower = 0n

async function main() {
	const wallet = await getWallet()
	console.log(`Repaying all debt up to ${attoString(amountToRepayPlusPadding)} ETH on behalf of 0x${await addressToChecksummedString(borrower)}...`)
	await wallet.callContract(cEtherRepayHelper, amountToRepayPlusPadding, 'repayBehalfExplicit(address borrower, address cEther)', borrower, cEther)
	console.log(`🎉`)
	process.exit(0)
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
