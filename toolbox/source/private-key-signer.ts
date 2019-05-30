import { ec as EllipticCurve } from 'elliptic'
import { keccak256 } from 'js-sha3'
import { Bytes, Bytes32, Address } from '@zoltu/recoverable-wallet-library';
const secp256k1 = new EllipticCurve('secp256k1')

export class Signer {
	private readonly keyPair: EllipticCurve.KeyPair
	constructor(privateKey: Bytes32) {
		this.keyPair = secp256k1.keyFromPrivate(privateKey)
	}
	sign = (message: Bytes, chainId?: number): { r: Bytes32, s: Bytes32, v: number } => {
		const messageHash = new Bytes(keccak256.arrayBuffer(message))
		const signature = this.keyPair.sign(messageHash, { pers: undefined, canonical: true })
		const v = (chainId === undefined)
			? signature.recoveryParam! + 27
			: signature.recoveryParam! + chainId * 2 + 35
		return {
			r: Bytes32.fromHexString(signature.r.toString(16).padStart(64, '0')),
			s: Bytes32.fromHexString(signature.s.toString(16).padStart(64, '0')),
			v: v,
		}
	}
	address = (): Address => {
		return Address.fromHexString(keccak256(this.publicKey().subarray(1)).substring(24))
	}
	publicKey = (): Bytes => {
		return Bytes.fromHexString(this.keyPair.getPublic('hex'))
	}
}
