import Jasmine = require('jasmine');
const jasmine = new Jasmine({})
jasmine.randomizeTests(false)

import { Crypto } from '@peculiar/webcrypto'
(global as any).crypto = new Crypto()

import { encodeMethod, decodeParameters } from '@zoltu/ethereum-abi-encoder';
import { keccak256 } from '@zoltu/ethereum-crypto';
import { Bytes } from '@zoltu/ethereum-types';
import { RecoverableWalletFactoryDeployer, RecoverableWalletFactory, RecoverableWallet, factoryAddress } from '@zoltu/recoverable-wallet-library'
import { createMnemonicRpc, SignerFetchRpc, createDeployerRpc } from './rpc-factories'
import { Erc20 } from './erc20-token';
import { factoryFor, walletFor, createWalletView } from './wallet-management';

const jsonRpcEndpoint = 'http://localhost:1237'

let aliceRpc: SignerFetchRpc
let bobRpc: SignerFetchRpc
let carolRpc: SignerFetchRpc
beforeAll(async () => {
	aliceRpc = await createMnemonicRpc(jsonRpcEndpoint, 10n**9n, 0)
	bobRpc = await createMnemonicRpc(jsonRpcEndpoint, 10n**9n, 1)
	carolRpc = await createMnemonicRpc(jsonRpcEndpoint, 10n**9n, 2)

	const balance = await aliceRpc.getBalance(await aliceRpc.addressProvider())
	if (balance > 10n**17n) {
		aliceRpc.sendEth(await bobRpc.addressProvider(), balance - 10n**17n)
	}

	const deployerRpc = await createDeployerRpc(aliceRpc)
	const deployer = new RecoverableWalletFactoryDeployer(deployerRpc)
	await deployer.ensureFactoryDeployed()
})

describe('setup', () => {
	it('factory deploys', async () => {
		// this test is a bit silly since beforeAll does this anyway and the process is idempotent, but wanted it here for documentation purposes
		const deployerRpc = await createDeployerRpc(aliceRpc)
		const deployer = new RecoverableWalletFactoryDeployer(deployerRpc)
		const deployedFactoryAddress = await deployer.ensureFactoryDeployed()
		expect(deployedFactoryAddress).toEqual(factoryAddress)
	})

	it('deploys twice to same address', async () => {
		const deployerRpc = await createDeployerRpc(aliceRpc)
		const deployer = new RecoverableWalletFactoryDeployer(deployerRpc)
		const firstAddress = await deployer.ensureFactoryDeployed()
		expect(await deployer.ensureFactoryDeployed()).toEqual(firstAddress)
	})

	it('creates a wallet', async () => {
		const factory = factoryFor(aliceRpc)
		const events = await factory.createWallet()
		expect(events.length).not.toEqual(0)
		const walletCreatedEvent = events.find(x => x.name === 'WalletCreated') as RecoverableWalletFactory.WalletCreated
		expect(walletCreatedEvent).toBeDefined()
		expect(walletCreatedEvent.parameters.owner).toEqual(await aliceRpc.addressProvider())
	})

	it('create multiple wallets', async () => {
		const events = await factoryFor(aliceRpc).createWallet()
		const walletCreatedEvent = events.find(x => x.name === 'WalletCreated') as RecoverableWalletFactory.WalletCreated
		const walletAddress = walletCreatedEvent.parameters.wallet

		const events2 = await factoryFor(aliceRpc).createWallet()
		const walletCreatedEvent2 = events2.find(x => x.name === 'WalletCreated') as RecoverableWalletFactory.WalletCreated
		expect(walletCreatedEvent2.parameters.wallet).not.toEqual(walletAddress)
	})

	it('starts without recovery addresses', async () => {
		const wallet = await walletFor(aliceRpc)
		const recoverers = await wallet.listRecoverers_()
		expect(recoverers.length).toEqual(0)
	})
})

describe('owner', () => {
	it('add recovery address', async () => {
		const recovererAddress = await bobRpc.addressProvider()
		const wallet = await walletFor(aliceRpc)
		const events = await wallet.addRecoveryAddress(recovererAddress, 1n)
		const event = events.find(x => x.name === 'RecoveryAddressAdded') as RecoverableWallet.RecoveryAddressAdded
		expect(event.parameters.newRecoverer).toEqual(recovererAddress)
		expect(event.parameters.recoveryDelayInDays).toEqual(1n)
		const recoverers = await wallet.listRecoverers_()
		expect(recoverers.length).toEqual(1)
		expect(recoverers[0].key).toEqual(recovererAddress)
		expect(recoverers[0].value).toEqual(1n)
	})

	it('add and remove recovery address', async () => {
		const recovererAddress = await carolRpc.addressProvider()
		const wallet = await walletFor(aliceRpc)
		await wallet.addRecoveryAddress(recovererAddress, 1n)

		const events = await wallet.removeRecoveryAddress(recovererAddress)
		const event = events.find(x => x.name === 'RecoveryAddressRemoved') as RecoverableWallet.RecoveryAddressRemoved
		expect(event.parameters.oldRecoverer).toEqual(recovererAddress)
		const recoverers = await wallet.listRecoverers_()
		expect(recoverers.length).toEqual(0)
	})

	it('can send eth', async () => {
		const wallet = await walletFor(aliceRpc)
		await aliceRpc.sendEth(wallet.address, 10n**18n)
		expect(await aliceRpc.getBalance(wallet.address)).toEqual(10n**18n)
		await wallet.execute(await aliceRpc.addressProvider(), 10n**18n, new Bytes(0))
		expect(await aliceRpc.getBalance(wallet.address)).toEqual(0n)
	})

	it('can deploy', async () => {
		const wallet = await walletFor(aliceRpc)
		const tokenAddress = await Erc20.deployFromWallet(wallet)
		const bytecode = await aliceRpc.getCode(tokenAddress)
		expect(bytecode.toString()).toEqual(Erc20.deployedBytecode.toString())

		const balanceCalldata = await encodeMethod(keccak256.hash, 'balanceOf(address)', [wallet.address])
		const encodedBalance = await aliceRpc.offChainContractCall({ to: tokenAddress, data: balanceCalldata })
		const balance = decodeParameters([{ name: 'result', type: 'uint256' }], encodedBalance)['result'] as bigint
		expect(balance).toEqual(1000n * 10n**18n)
	})

	it('can execute', async () => {
		const wallet = await walletFor(aliceRpc)
		const tokenAddress = await Erc20.deployFromWallet(wallet)
		expect(await Erc20.balanceOf(bobRpc, tokenAddress)).toEqual(0n)

		await Erc20.sendFromWallet(wallet, tokenAddress, await bobRpc.addressProvider(), 10n**18n)

		expect(await Erc20.balanceOf(bobRpc, tokenAddress)).toEqual(10n**18n)
	})
})

describe('recoverer', () => {
	it('recoverer cannot execute', async () => {
		const bobAddress = await bobRpc.addressProvider()
		const wallet = await walletFor(aliceRpc)
		const walletAsBob = await createWalletView(wallet, bobRpc)
		const tokenAddress = await Erc20.deployFromWallet(wallet)
		await wallet.addRecoveryAddress(bobAddress, 1n)

		// TODO: figure out how to deal with the fact that rejection messages aren't available in eth_estimateGas
		// Option 1: in fetch-json-rpc library, first do an eth_call and look to see if the result is an encoded error (Geth/Nethermind only)
		// Option 2: in fetch-json-rpc library, if eth_estimateGas fails follow-up with an eth_call to see if we can get a rejection message
		// Option 3: provide a custom gas estimator function to fetch-json-rpc and do either of the above
		await expectAsync(Erc20.sendFromWallet(walletAsBob, tokenAddress, bobAddress, 10n*18n)).toBeRejected()
	})

	it('recoverer cannot deploy', async () => {
		const wallet = await walletFor(aliceRpc)
		const walletAsBob = await createWalletView(wallet, bobRpc)
		await wallet.addRecoveryAddress(await bobRpc.addressProvider(), 1n)

		await expectAsync(Erc20.deployFromWallet(walletAsBob)).toBeRejected()
	})

	it('recoverer cannot add recoverer', async () => {
		const wallet = await walletFor(aliceRpc)
		const walletAsBob = await createWalletView(wallet, bobRpc)
		await wallet.addRecoveryAddress(await bobRpc.addressProvider(), 1n)

		await expectAsync(walletAsBob.addRecoveryAddress(await carolRpc.addressProvider(), 1n)).toBeRejected()
	})

	it('recoverer cannot recover immediately', async () => {
		const wallet = await walletFor(aliceRpc)
		const walletAsBob = await createWalletView(wallet, bobRpc)
		await wallet.addRecoveryAddress(await bobRpc.addressProvider(), 1n)

		await expectAsync(walletAsBob.finishRecovery()).toBeRejected()
	})

	it('recoverer cannot recover without waiting for delay', async () => {
		const wallet = await walletFor(aliceRpc)
		const walletAsBob = await createWalletView(wallet, bobRpc)
		await wallet.addRecoveryAddress(await bobRpc.addressProvider(), 1n)
		await walletAsBob.startRecovery()

		await expectAsync(walletAsBob.finishRecovery()).toBeRejected()
	})

	it('no delay allows instant recovery', async () => {
		const wallet = await walletFor(aliceRpc)
		const walletAsBob = await createWalletView(wallet, bobRpc)
		await wallet.addRecoveryAddress(await bobRpc.addressProvider(), 0n)
		await walletAsBob.startRecovery()

		await walletAsBob.finishRecovery()
		expect(await walletAsBob.owner_()).toEqual(await bobRpc.addressProvider())
	})
})

describe('stranger', () => {
	it('stranger cannot execute', async () => {
		const bobAddress = await bobRpc.addressProvider()
		const wallet = await walletFor(aliceRpc)
		const walletAsBob = await createWalletView(wallet, bobRpc)
		const tokenAddress = await Erc20.deployFromWallet(wallet)

		await expectAsync(Erc20.sendFromWallet(walletAsBob, tokenAddress, bobAddress, 10n*18n)).toBeRejected()
	})

	it('stranger cannot deploy', async () => {
		const wallet = await walletFor(aliceRpc)
		const walletAsBob = await createWalletView(wallet, bobRpc)

		await expectAsync(Erc20.deployFromWallet(walletAsBob)).toBeRejected()
	})

	it('stranger cannot add recoverer', async () => {
		const wallet = await walletFor(aliceRpc)
		const walletAsBob = await createWalletView(wallet, bobRpc)

		await expectAsync(walletAsBob.addRecoveryAddress(await carolRpc.addressProvider(), 1n)).toBeRejected()
	})

	it('stranger cannot start recovery', async () => {
		const wallet = await walletFor(aliceRpc)
		const walletAsBob = await createWalletView(wallet, bobRpc)

		await expectAsync(walletAsBob.startRecovery()).toBeRejected()
	})
})

jasmine.execute()
