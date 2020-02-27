import { Bytes, JsonRpc } from '@zoltu/ethereum-types'
import { parseSignature, encodeParameters, encodeMethod, decodeParameters } from '@zoltu/ethereum-abi-encoder'
import { RecoverableWallet } from '@zoltu/recoverable-wallet-library'
import { SignerFetchRpc } from './rpc-factories'
import { keccak256 } from '@zoltu/ethereum-crypto'

export namespace Erc20 {
	export const sourceCode = `
pragma solidity 0.6.3;

contract ERC20 {
	event Transfer(address indexed from, address indexed to, uint256 value);
	event Approval(address indexed owner, address indexed spender, uint256 value);
	mapping (address => uint256) public balanceOf;
	mapping (address => mapping (address => uint256)) public allowance;
	uint256 public totalSupply;

	constructor(address recipient) public {
		balanceOf[recipient] = 1000 * 10**18;
	}

	function transfer(address recipient, uint256 amount) public returns (bool) {
		_transfer(msg.sender, recipient, amount);
		return true;
	}
	function approve(address spender, uint256 amount) public returns (bool) {
		allowance[msg.sender][spender] = amount;
		emit Approval(msg.sender, spender, amount);
		return true;
	}
	function transferFrom(address sender, address recipient, uint256 amount) public returns (bool) {
		uint256 startingAllowance = allowance[msg.sender][sender];
		require(startingAllowance >= amount, "Operator doesn't have enough allowance.");
		if (startingAllowance < uint256(-1)) {
			allowance[msg.sender][sender] = startingAllowance - amount;
		}
		_transfer(sender, recipient, amount);
		return true;
	}
	function _transfer(address sender, address recipient, uint256 amount) internal {
		require(balanceOf[sender] >= amount, "Sender doesn't have enough funds.");
		balanceOf[sender] -= amount;
		balanceOf[recipient] += amount;
		emit Transfer(sender, recipient, amount);
	}
}
`
	export const address = 0xa15579ce14e99bfb943a76dcc0d818f30cc408adn
	export const deploymentBytecode = Bytes.fromHexString('608060405234801561001057600080fd5b506040516108483803806108488339818101604052602081101561003357600080fd5b8101908080519060200190929190505050683635c9adc5dea000006000808373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002081905550506107a8806100a06000396000f3fe608060405234801561001057600080fd5b50600436106100625760003560e01c8063095ea7b31461006757806318160ddd146100cd57806323b872dd146100eb57806370a0823114610171578063a9059cbb146101c9578063dd62ed3e1461022f575b600080fd5b6100b36004803603604081101561007d57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803590602001909291905050506102a7565b604051808215151515815260200191505060405180910390f35b6100d5610399565b6040518082815260200191505060405180910390f35b6101576004803603606081101561010157600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803573ffffffffffffffffffffffffffffffffffffffff1690602001909291908035906020019092919050505061039f565b604051808215151515815260200191505060405180910390f35b6101b36004803603602081101561018757600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff16906020019092919050505061053d565b6040518082815260200191505060405180910390f35b610215600480360360408110156101df57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff16906020019092919080359060200190929190505050610555565b604051808215151515815260200191505060405180910390f35b6102916004803603604081101561024557600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803573ffffffffffffffffffffffffffffffffffffffff16906020019092919050505061056c565b6040518082815260200191505060405180910390f35b600081600160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508273ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925846040518082815260200191505060405180910390a36001905092915050565b60025481565b600080600160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000205490508281101561047a576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252602781526020018061072b6027913960400191505060405180910390fd5b7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff81101561052657828103600160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008773ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055505b610531858585610591565b60019150509392505050565b60006020528060005260406000206000915090505481565b6000610562338484610591565b6001905092915050565b6001602052816000526040600020602052806000526040600020600091509150505481565b806000808573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020541015610628576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260218152602001806107526021913960400191505060405180910390fd5b806000808573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008282540392505081905550806000808473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825401925050819055508173ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef836040518082815260200191505060405180910390a350505056fe4f70657261746f7220646f65736e2774206861766520656e6f75676820616c6c6f77616e63652e53656e64657220646f65736e2774206861766520656e6f7567682066756e64732ea264697066735822122019524a21bae406dd57b7f00267e2b81428a222abcd8854f53ea1984c9a4eb1fe64736f6c63430006030033')
	export const deployedBytecode = Bytes.fromHexString('608060405234801561001057600080fd5b50600436106100625760003560e01c8063095ea7b31461006757806318160ddd146100cd57806323b872dd146100eb57806370a0823114610171578063a9059cbb146101c9578063dd62ed3e1461022f575b600080fd5b6100b36004803603604081101561007d57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803590602001909291905050506102a7565b604051808215151515815260200191505060405180910390f35b6100d5610399565b6040518082815260200191505060405180910390f35b6101576004803603606081101561010157600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803573ffffffffffffffffffffffffffffffffffffffff1690602001909291908035906020019092919050505061039f565b604051808215151515815260200191505060405180910390f35b6101b36004803603602081101561018757600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff16906020019092919050505061053d565b6040518082815260200191505060405180910390f35b610215600480360360408110156101df57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff16906020019092919080359060200190929190505050610555565b604051808215151515815260200191505060405180910390f35b6102916004803603604081101561024557600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803573ffffffffffffffffffffffffffffffffffffffff16906020019092919050505061056c565b6040518082815260200191505060405180910390f35b600081600160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508273ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925846040518082815260200191505060405180910390a36001905092915050565b60025481565b600080600160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000205490508281101561047a576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252602781526020018061072b6027913960400191505060405180910390fd5b7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff81101561052657828103600160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008773ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055505b610531858585610591565b60019150509392505050565b60006020528060005260406000206000915090505481565b6000610562338484610591565b6001905092915050565b6001602052816000526040600020602052806000526040600020600091509150505481565b806000808573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020541015610628576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260218152602001806107526021913960400191505060405180910390fd5b806000808573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008282540392505081905550806000808473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825401925050819055508173ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef836040518082815260200191505060405180910390a350505056fe4f70657261746f7220646f65736e2774206861766520656e6f75676820616c6c6f77616e63652e53656e64657220646f65736e2774206861766520656e6f7567682066756e64732ea264697066735822122019524a21bae406dd57b7f00267e2b81428a222abcd8854f53ea1984c9a4eb1fe64736f6c63430006030033')
	export const isDeployed = async (rpc: JsonRpc) => {
		const bytecode = await rpc.getCode(address)
		if (deployedBytecode.equals(bytecode)) return true
		if (bytecode.length === 0) return false
		throw new Error(`Code is deployed to ${address.toString(16)} but it is not the token source code.`)
	}
	export const ensureDeployed = async (rpc: JsonRpc) => {
		if (await isDeployed(rpc)) return address
		const constructorDescription = parseSignature('constructor(address)')
		const encodedParameters = encodeParameters(constructorDescription.inputs, [0x913da4198e6be1d5f5e4a40d0667f70c0b5430ebn])
		const data = new Uint8Array([...deploymentBytecode, ...encodedParameters])
		const proxyDeployer = 0x7a0d94f55792c434d74a40883c6ed8545e406d12n
		await rpc.onChainContractCall({ to: proxyDeployer, data })
		return address
	}

	export async function deployFromWallet(wallet: RecoverableWallet, tokenRecipient?: bigint) {
		tokenRecipient = tokenRecipient || wallet.address
		const constructorParameters = encodeParameters([{ name: 'recipient', type: 'address' }], [tokenRecipient])
		const constructorCall = Bytes.fromByteArray([...Erc20.deploymentBytecode, ...constructorParameters])
		const tokenAddress = await wallet.deploy_(0n, constructorCall, 0n)
		await wallet.deploy(0n, constructorCall, 0n)
		return tokenAddress
	}

	export async function balanceOf(rpc: SignerFetchRpc, tokenAddress: bigint, holder?: bigint) {
		holder = holder || await rpc.addressProvider()
		const calldata = await encodeMethod(keccak256.hash, 'balanceOf(address)', [holder])
		const encodedBalance = await rpc.offChainContractCall({ to: tokenAddress, data: calldata })
		return decodeParameters([{ name: 'result', type: 'uint256' }], encodedBalance).result as bigint
	}

	export async function sendFromWallet(wallet: RecoverableWallet, tokenAddress: bigint, destination: bigint, amount: bigint): Promise<void> {
		const transferCalldata = await encodeMethod(keccak256.hash, 'transfer(address,uint256)', [destination, amount])
		await wallet.execute(tokenAddress, 0n, transferCalldata)
	}
}
