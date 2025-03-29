# Recoverable Wallet

## Deprecated
This project has been deprecated in favor of Gnosis SAFE which now supports time delayed recovery.

## What

This is an Ethereum wallet contract that allows you to set recovery addresses, each with a separate recovery delay.  If a recovery address initiates a recovery, then they have to wait for the delay before they can takeover the account.  At any point during that interval the owner can cancel the recovery process and (optionally) revoke the recovery rights of the address that initiated the recovery.

## Why

### Risk of Theft vs Risk of Loss

While a hardware wallet is often considered the most secure way to store your assets, you are still faced with a choice between theft risk or loss risk.  If you write down your seed phrase, then you are at risk of someone gaining access to your seed phrase which is a full account compromise.  If you don't write down your seed phrase, you are at risk of losing access to your account should you lose access to your hardware wallet (e.g., damage, loss, failure reset, etc.).  Almost all people choose theft risk over loss risk which means they need to secure their recovery seed.  Unfortunately, securing your recovery seed phrase against a motivated attacker is incredibly difficult and something that most people are not equipped to handle.

Recoverable Wallet makes it so you no longer have to choose between risk of theft or risk of loss.  You can secure the wallet with a hardware device and destroy the recovery seed, without taking on risk of loss.  To achieve this, you would setup one or more recovery addresses that can be secured with lower security requirements so that if you _do_ lose access to your primary address you can _eventually_ recover access to your accont.

An example setup might be that you have a Ledger Nano X as your primary device, and then have an older Ledger Nano S as the first recovery device and a mnemonic as a third recovery device.  You would then destroy the recovery phrase for both of the Ledger devices.  You may keep the Ledger Nano X on your desk or on your keychain for easy access, and put the Ledger Nano S is a safety deposit box or firesafe in your home somewhere.  You would then store the mnemonic somewhere where you can _notice_ if it is stolen, but otherwise it doesn't need to be particularly secure!

Attack/Loss scenarios:
1. You lose the Ledger Nano X: Simply recover the account with your Ledger Nano S.
2. You lose the Ledger Nano X and when you try to recover with the Ledger Nano S you find that it has broken: Recover with the mnemonic.
3. Someone steals the Ledger Nano X: No big deal, they get 3 tries to unlock it before it self-wipes and you can recover access to your account.
4. Someone steals the Ledger Nano X and your mnemonic: As long as you _notice_ the theft before the recovery delay is over you can recover using the Ledger Nano S.
5. Someone steals the mnemonic: As long as you _notice_ that the mnemonic has been stolen you can revoke its access and create a new mnemonic to replace it.

In order for someone to successfully compromise your account, they would need to steal your recovery phrase at the same time as disabling/destroying/stealing your hardware wallets.  This is _much_ harder than stealing a single mnemonic, especially if at least one of the hardware wallets is secured off-site.

In order to lose access to your account, you would need to lose access to all 3 accounts at the same time.  If you lose access to a subset, you can always use any of the others to recover.

There is no limit to the number of recovery devices you can configure, so you you can setup as many fallback scenarios as you see fit!  If you are securing millions of dollars, it is probably worth buying 5 hardware wallets and securing them in different locations around the world along with having one or more recovery mnemonics stored in tamper evident packaging that you check on regularly.  If you are only securing a small amount of funds, a single hardware wallet with a mnemonic stored in tamper evident packaging on your desk may be good enough.

### Survivorship

Often people want their crypto assets to go to family members in the case of their death.  Unfortunately, the most obvious way to achieve this is to give your family direct access to your wallet.  However, often times the people you want to have access to your funds after your death do not maintain the same level of operational security as you do, or perhaps you may not fully trust them with access to all of your assets while you are alive.  In either case, Recoverable Wallet can protect you from negligent or malicious loved ones.

First, setup a recoverable wallet with whatever risk/loss protection you desire (see above).  Second, ask your loved ones for an Ethereum address that they want to use to recover your account.  This could be a highly secured account, or just a paper wallet if they aren't into crypto.  Take their address and add it as a recovery address with a 365-day recovery delay.  In the case of your unexpected death, they can initiate the recovery process and a year later they will gain access to your funds.  In the case of a malicious family member, as long as you _notice_ that someone initiated a recovery during the 365-days then you'll be able to cancel the recovery (and optionally revoke the account).  Since any operations other than cancelling the recovery are impossible while a recovery is underway, as long as you use your wallet once a year you'll notice if someone initiates a recovery.

## How

The core of this project is an Ethereum smart contract that allows you to proxy calls through it, or add/remove recovery addresess, initiate recovery, and cancel recovery.  In addition, there ~~is~~ will be a UI that allows you to easily interact with the smart contract.  Finally, the wallet ~~is~~ will be integrated into popular wallets like MetaMask.

The contract is split into two pieces.  One is a factory that lives at a well defined address on all blockchains.  This factory makes it easy to instantiate a new wallet and monitor new wallet creation (since an event is emitted every time a wallet is created by the factory).  The wallet contract itself only has a small number of public functions and contains documentation comments on them to make it easy to interact with them.

----

## Development

### Dev Setup
```
cd contracts
npm install
npm run build
```

### NPM Package
A library for interacting with and deploying the smart contract is published to NPM at `@zoltu/recoverable-wallet-library`.  The library contains the following:
1. A deployment script for deploying the contract to a well known address which is the same on every blockchain (which can be found in `deployment-parameters.js` of the NPM package).
1. A library for interfacing with the contract.
1. TypeScript definition files for the library so you get a strongly typed interface.
1. The bytecode of the contracts, in case you want to do your own deployment.
1. The ABI of the compiled contracts, for ease of interacting with them using other tooling.

#### Deployment Script
```
npm install @zoltu/recoverable-wallet-library
```
```typescript
import { RecoverableWalletJsonRpc, RecoverableWalletFactoryDeployer, RecoverableWalletFactory, Dependencies } from '@zoltu/recoverable-wallet-library'

// set this address to whatever you will be signing with
const signerAddress = 0x913da4198e6be1d5f5e4a40d0667f70c0b5430ebn
const gasPrice = 10n**9n
const jsonRpc = new RecoverableWalletJsonRpc(async (method, params) => ethereum.send({method, params}), signerAddress, `0x${gasPrice.toString(16)}`)
const deployer = new RecoverableWalletFactoryDeployer(jsonRpc)
// make sure that the proxy deployer is deployed to this chain (exists at well known address)
await deployer.ensureProxyDeployerDeployed()
// make sure that ERC1820 is deployed to this chain (exists at well known address)
await deployer.ensureErc1820Deployed()
// make sure that the recoverable wallet factor is deployed to this chain (exists at a well known address, we return it here for convenience)
const factoryAddress = await deployer.ensureFactoryDeployed()

// see toolbox/source/dependencies.ts for an example of how to setup dependencies
const dependencies = ;

// create a wallet
const recoverableWalletFactory = new RecoverableWalletFactory(dependencies, factoryAddress)
const walletCreationEvents = await recoverableWalletFactory.createWallet()
const walletCreatedEvent = walletCreationEvents.find(x => x.name === 'WalletCreated') as RecoverableWalletFactory.WalletCreated<bigint>
if (walletCreatedEvent === undefined) throw new Error(`Expected wallet_created event.`)
const walletAddress = walletCreatedEvent.parameters.wallet

// use a wallet
const wallet = new RecoverableWallet(dependencies, walletAddress)
// TODO: send some ETH to the wallet (so it has something to send)
// tell the wallet to send some ETH to `destination`
await this.wallet.execute(destination, toAttoeth(amountInEth), new Bytes())
// TODO: send some tokens to the wallet (so it has something to send)
// tell the wallet to send some tokens to `destination`, note that we have to encode the method call ourselves
const data = await encodeMethod(keccak256.hash, 'transfer(address,uint256)', [destination, 10n**18n])
await this.wallet.execute(tokenAddress, 0n, data)
```

----

[Audit by OpenZeppelin](https://blog.openzeppelin.com/recoverable-wallet-audit/)
