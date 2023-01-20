import { HexAddress } from './types.js'

export function fromChecksummedAddress(address: string) {
	// if (!microEthSigner.Address.verifyChecksum(address)) throw new Error(`Address ${address} failed checksum verification.`)
	return address as HexAddress
}
