import { ec as EllipticCurve } from 'elliptic'
import { keccak256 } from 'js-sha3'
import { Bytes, Bytes32, Bytes1, Address } from '@zoltu/ethereum-types';
const secp256k1 = new EllipticCurve('secp256k1')

export class Signer {
	private readonly keyPair: EllipticCurve.KeyPair
	constructor(privateKey: Bytes32) {
		this.keyPair = secp256k1.keyFromPrivate(privateKey)
	}
	sign = (message: Bytes): { r: Bytes32, s: Bytes32, v: Bytes1 } => {
		const messageHash = new Bytes(keccak256.arrayBuffer(message))
		const signature = this.keyPair.sign(messageHash, { pers: undefined, canonical: true })
		return {
			r: Bytes32.fromHexString(signature.r.toString(16).padStart(64, '0')),
			s: Bytes32.fromHexString(signature.s.toString(16).padStart(64, '0')),
			v: Bytes1.fromHexString((27 + signature.recoveryParam!).toString(16)),
		}
	}
	address = (): Address => {
		return Address.fromHexString(keccak256(this.publicKey().subarray(1)).substring(24))
	}
	publicKey = (): Bytes => {
		return Bytes.fromHexString(this.keyPair.getPublic('hex'))
	}
}
