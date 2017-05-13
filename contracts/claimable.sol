pragma solidity 0.4.10;

import "./ownable.sol";

contract Claimable is Ownable {
	address internal _pendingOwner;

	modifier onlyPendingOwner() {
		require(msg.sender == _pendingOwner);
		_;
	}

	function getPendingOwner() external constant returns (address) {
		return _pendingOwner;
	}

	function transferOwnership(address newOwner) external onlyOwner {
		require(newOwner != address(0));
		_pendingOwner = newOwner;
	}

	function claimOwnership() external onlyPendingOwner {
		_owner = _pendingOwner;
		_pendingOwner = address(0);
	}
}
