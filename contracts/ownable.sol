pragma solidity 0.4.10;

contract Ownable {
	address public _owner;

	function Ownable() {
		_owner = msg.sender;
	}

	modifier onlyOwner() {
		require(msg.sender == _owner);
		_;
	}

	function getOwner() external constant returns (address) {
		return _owner;
	}

	function transferOwnership(address newOwner) external onlyOwner {
		require(newOwner != address(0));
		_owner = newOwner;
	}
}
