# Architecture

## Plugin
* UI for entering in the address of the Recoverable Wallet contract you want to interact with.
* Waits for MetaMask to inject, and then monkey-patches `window.ethereum.sendAsync` to send to plugin instead of MetaMask.
* UI for managing the Recoverable Wallet (executed through https://github.com/MetaMask/metamask-extension-provider):
 * transfer ETH
 * view owner address
 * transfer ownership
 * accept ownership
 * view recovery addresses
 * add recovery address
 * remove recovery address
 * alert on active recovery (and the address that started it)
 * start recovery
 * cancel recovery

## Injected Code
* calls to `eth_sendTransaction` (via `window.ethereum.sendAsync`) are replaced with a call that is proxied through the Recoverable Wallet contract before being passed along to MetaMask
* intercepts calls that fetch the user's address and replaces the address with that of the Recoverable Wallet contract

## Smart Contract
* has a proxied_call entrypoint (only_owner) where the passed calldata is called by the wallet contract, so the wallet can execute any contract call the user wants (e.g., .transfer)
* has a function for withdrawing ETH (tokens can be transferred via proxying a `.transfer` call)


## Dev Setup
### Visual Studio Code
Command Palette > `Tasks: Run Build Task` > `npm: watch - browser-extension`
