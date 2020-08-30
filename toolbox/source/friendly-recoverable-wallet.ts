import { RecoverableWallet, Event } from '@zoltu/recoverable-wallet-library'
import { Bytes, JsonRpc } from '@zoltu/ethereum-types'
import { encodeMethod, EncodableArray, encodeParameters, parseSignature } from '@zoltu/ethereum-abi-encoder'
import { keccak256 } from '@zoltu/ethereum-crypto'
import { toAttoeth, toEth } from './utils';
import { DependenciesImpl } from './dependencies';
import { addressToChecksummedString } from '@zoltu/ethereum-crypto/output-node/ethereum';

export class FriendlyRecoverableWallet {
	public constructor(
		public readonly rpc: JsonRpc,
		private readonly wallet: RecoverableWallet
	) { }

	public static readonly create = async (rpc: JsonRpc, address: bigint): Promise<FriendlyRecoverableWallet> => {
		const dependencies = new DependenciesImpl(rpc)
		const recoverableWallet = new RecoverableWallet(dependencies, address)
		dependencies.callFrom = await recoverableWallet.owner_()
		return new FriendlyRecoverableWallet(rpc, recoverableWallet)
	}

	public readonly getAddress = (): bigint => this.wallet.address
	public readonly getAddressString = async (): Promise<string> => await addressToChecksummedString(this.getAddress())

	public readonly getOwner = async (): Promise<bigint> => await this.wallet.owner_()
	public readonly getOwnerString = async (): Promise<string> => await addressToChecksummedString(await this.getOwner())

	public readonly getSigner = async (): Promise<bigint | null> => await this.rpc.coinbase()
	public readonly getSignerString = async (): Promise<string> => {
		const signer = await this.getSigner()
		return signer !== null ? await addressToChecksummedString(signer) : 'none'
	}

	public readonly getAttoethBalance = async (): Promise<bigint> => await this.rpc.getBalance(this.wallet.address)

	public readonly getEthBalance = async (): Promise<number> => toEth(await this.getAttoethBalance())

	public readonly getIndivisibletokenBalance = async (tokenAddress: bigint): Promise<bigint> => Bytes.fromByteArray(await this.callContractLocal(tokenAddress, 0n, 'balanceOf(address)', this.getAddress())).toUnsignedBigint()

	public readonly listRecoverers = async (): Promise<{address: bigint, delay: bigint}[]> => {
		const results = await this.wallet.listRecoverers_()
		return results.map(x => ({ address: x.key, delay: x.value }))
	}

	public readonly getRecoveryDelayFor = async (address: bigint) => {
		return await this.wallet.getRecoveryDelayInDays_(address)
	}

	public readonly activeRecoveryDetails = async () => {
		const address = await this.wallet.activeRecoveryAddress_()
		const time = await this.wallet.activeRecoveryEndTime_()
		return { address, time }
	}

	public readonly sendEther = async (destination: bigint, amountInEth: number | bigint): Promise<readonly Event[]> => await this.wallet.execute(destination, toAttoeth(amountInEth), new Bytes())

	public readonly sendToken = async (tokenAddress: bigint, destination: bigint, attotoken: bigint): Promise<readonly Event[]> => {
		const data = await encodeMethod(keccak256.hash, 'transfer(address,uint256)', [destination, attotoken])
		return await this.wallet.execute(tokenAddress, 0n, data)
	}

	public readonly addRecoveryAddress = async (newRecoveryAddress: bigint, recoveryDelayInDays: bigint): Promise<void> => {
		const events = await this.wallet.addRecoveryAddress(newRecoveryAddress, recoveryDelayInDays)
		const recoveryAddressAddedEvent = events.find(x => x.name === 'RecoveryAddressAdded') as RecoverableWallet.RecoveryAddressAdded | undefined
		if (recoveryAddressAddedEvent === undefined) throw new Error(`Expected RecoveryAddressAdded event.`)
		if (recoveryAddressAddedEvent.parameters.newRecoverer !== newRecoveryAddress) throw new Error(`RecoveryAddressAdded event indicates that ${await addressToChecksummedString(recoveryAddressAddedEvent.parameters.newRecoverer)} was added but expected ${await addressToChecksummedString(newRecoveryAddress)} to be added.`)
		if (recoveryAddressAddedEvent.parameters.recoveryDelayInDays !== recoveryDelayInDays) throw new Error(`Expected recovery delay to be ${recoveryDelayInDays} days but event says it is ${recoveryAddressAddedEvent.parameters.recoveryDelayInDays}`)
		const onChainRecoveryDelay = await this.wallet.getRecoveryDelayInDays_(newRecoveryAddress)
		if (onChainRecoveryDelay !== recoveryDelayInDays) throw new Error(`New recoverer has ${onChainRecoveryDelay} days delay but expected ${recoveryDelayInDays}.`)
	}

	public readonly removeRecoveryAddress = async (oldRecoveryAddress: bigint) => {
		const events = await this.wallet.removeRecoveryAddress(oldRecoveryAddress)
		const recoveryAddressRemovedEvent = events.find(x => x.name === 'RecoveryAddressRemoved') as RecoverableWallet.RecoveryAddressRemoved | undefined
		if (recoveryAddressRemovedEvent === undefined) throw new Error(`Expected RecoveryAddressRemoved event.`)
		if ((await this.wallet.listRecoverers_()).find(x => x.key === oldRecoveryAddress) !== undefined) throw new Error(`Removed recoverer is still in the recoverer set!`)
	}

	public readonly startRecovery = async (): Promise<bigint> => {
		const events = await this.wallet.startRecovery()
		const recoveryStartedEvent = events.find(x => x.name === 'RecoveryStarted') as RecoverableWallet.RecoveryStarted | undefined
		if (recoveryStartedEvent === undefined) throw new Error(`Expected RecoveryAddressAdded event.`)
		if (recoveryStartedEvent.parameters.newOwner !== await this.getSigner()) throw new Error(`Expected new pending owner to be ${await this.getSignerString()} but it was ${await addressToChecksummedString(recoveryStartedEvent.parameters.newOwner)}`)
		return recoveryStartedEvent.parameters.newOwner
	}

	public readonly cancelRecovery = async (): Promise<void> => {
		const events = await this.wallet.cancelRecovery()
		const recoveryCancelledEvent = events.find(x => x.name === 'RecoveryCancelled') as RecoverableWallet.RecoveryCancelled | undefined
		if (recoveryCancelledEvent === undefined) throw new Error(`Expected RecoveryCancelled event.`)
		if (await this.wallet.activeRecoveryAddress_() !== 0n) throw new Error(`Recovery cancelation was a success but there is still an active recoverer.`)
		if (await this.wallet.activeRecoveryEndTime_() !== 115792089237316195423570985008687907853269984665640564039457584007913129639935n) throw new Error(`Expected active recovery end time to be uint(-1), but it was ${await this.wallet.activeRecoveryEndTime_()}`)
	}

	public readonly finishRecovery = async (): Promise<bigint> => {
		const events = await this.wallet.finishRecovery()
		const recoveryFinishedEvent = events.find(x => x.name === 'RecoveryFinished') as RecoverableWallet.RecoveryFinished | undefined
		if (recoveryFinishedEvent === undefined) throw new Error(`Expected RecoveryFinished event.`)
		if (recoveryFinishedEvent.parameters.newOwner !== await this.wallet.owner_()) throw new Error(`RecoveryFinished event reports new owner is ${await addressToChecksummedString(recoveryFinishedEvent.parameters.newOwner)} which differs from actual current owner ${await addressToChecksummedString(await this.wallet.owner_())}.`)
		return recoveryFinishedEvent.parameters.newOwner
	}

	public readonly callContractLocal = async (contractAddress: bigint, value: bigint, methodSignature: string, ...parameters: EncodableArray): Promise<Uint8Array> => {
		const data = await encodeMethod(keccak256.hash, methodSignature, parameters)
		return await this.wallet.execute_(contractAddress, value, data)
	}

	public readonly callContract = async (contractAddress: bigint, value: bigint, methodSignature: string, ...parameters: EncodableArray): Promise<readonly Event[]> => {
		const data = await encodeMethod(keccak256.hash, methodSignature, parameters)
		return await this.wallet.execute(contractAddress, value, data)
	}

	public readonly deploy = async (deploymentBytecode: Bytes, constructorSignature: string, parameters: EncodableArray): Promise<bigint> => {
		const constructorDescription = parseSignature(constructorSignature)
		const encodedParameters = encodeParameters(constructorDescription.inputs, parameters)
		const data = new Uint8Array([...deploymentBytecode, ...encodedParameters])
		const address = await this.wallet.deploy_(0n, data, 0n)
		await this.wallet.deploy(0n, data, 0n)
		return address
	}
}
