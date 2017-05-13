pragma solidity 0.4.10;

import "./claimable.sol";
import "./token.sol";

contract RecoverableWallet is Claimable {
	mapping(address => address) private _recoveryAddresses;
	address private _activeRecoveryAddress;
	uint256 private _activeRecoveryStartTime;

	function addRecoveryAddress(address newRecoveryAddress) external onlyOwner {
		_recoveryAddresses[newRecoveryAddress] = 1;
	}

	function removeRecoveryAddress(address oldRecoveryAddress) external onlyOwner {
		_recoveryAddresses[oldRecoveryAddress] = 0;
	}

	function startRecovery(address newOwnerAddress) external {
		require(_recoveryAddresses[msg.sender] == 1);
		require(_activeRecoveryAddress == address(0));

		_activeRecoveryAddress = newOwnerAddress;
		_activeRecoveryStartTime = block.timestamp;
	}

	function cancelRecovery() external onlyOwner {
		_activeRecoveryAddress = address(0);
		_activeRecoveryStartTime = 0;
	}

	function finishRecovery() external {
		require(_activeRecoveryAddress != address(0));
		require(block.timestamp > _activeRecoveryStartTime + 3 days);

		_pendingOwner = _activeRecoveryAddress;
		_activeRecoveryAddress = address(0);
		_activeRecoveryStartTime = 0;
	}

	function sendEther(address destination, uint256 amount) external onlyOwner {
		destination.transfer(amount);
	}

	function sendToken(address tokenAddress, address destination, uint256 amount) external onlyOwner {
		Token token = Token(tokenAddress);
		bool success = token.transfer(destination, amount);
		require(success);
	}

	function approveToken(address tokenAddress, address spender, uint256 amount) external onlyOwner {
		Token token = Token(tokenAddress);
		bool success = token.approve(spender, amount);
		require(success);
	}

	// TODO: allow calling arbitrary contracts by owner
}
