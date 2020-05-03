declare module 'eth-ens-namehash' {
	export function hash(ensName: string): string
	export function normalize(ensName: string): string
}

