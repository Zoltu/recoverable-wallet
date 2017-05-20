pragma solidity 0.4.10;

import "./claimable.sol";
import "./token.sol";

contract RecoverableWallet is Claimable {
	event RecoveryStarted(address indexed initiator, address indexed newOwner);

	mapping(address => address) private _recoveryAddresses;
	address private _activeRecoveryAddress;
	uint256 private _activeRecoveryStartTime;
	uint8 private _recoveryDelayDays;

	function RecoverableWallet(uint8 recoveryDelayInDays) {
		_recoveryDelayDays = recoveryDelayDays;
	}

	function () external payable { }

	function addRecoveryAddress(address newRecoveryAddress) external onlyOwner {
		_recoveryAddresses[newRecoveryAddress] = 1;
	}

	function removeRecoveryAddress(address oldRecoveryAddress) external onlyOwner {
		_recoveryAddresses[oldRecoveryAddress] = 0;
	}

	function startRecovery(address newOwnerAddress) external {
		require(_recoveryAddresses[msg.sender] == 1);
		require(_activeRecoveryAddress == address(0));

		RecoveryStarted(msg.sender, newOwnerAddress);
		_activeRecoveryAddress = newOwnerAddress;
		_activeRecoveryStartTime = block.timestamp;
	}

	function cancelRecovery() external onlyOwner {
		_activeRecoveryAddress = address(0);
		_activeRecoveryStartTime = 0;
	}

	function finishRecovery() external {
		require(_activeRecoveryAddress != address(0));
		require(block.timestamp > _activeRecoveryStartTime + _recoveryDelayDays * 1 days);

		_pendingOwner = _activeRecoveryAddress;
		_activeRecoveryAddress = address(0);
		_activeRecoveryStartTime = 0;
	}

	function sendEther(address destination, uint256 amount) external onlyOwner {
		destination.transfer(amount);
	}

	function sendToken(address tokenAddress, address destination, uint256 amount) external onlyOwner {
		Token token = Token(tokenAddress);
		require(token.transfer(destination, amount));
	}

	function approveToken(address tokenAddress, address spender, uint256 amount) external onlyOwner {
		Token token = Token(tokenAddress);
		require(token.approve(spender, amount));
	}

	// TODO: allow calling arbitrary contracts by owner
}
