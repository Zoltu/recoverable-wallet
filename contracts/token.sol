pragma solidity 0.4.10;

contract Token {
	mapping(address => uint256) _balances;

	event Transfer(address indexed from, address indexed to, uint256 value);
	event Approval(address indexed owner, address indexed spender, uint256 value);

	function Token() {
		_balances[msg.sender] = 10**36;
	}

	function totalSupply() external constant returns (uint256 totalSupply) {
		return 10**36;
	}
	function balanceOf(address who) external constant returns (uint256 balance) {
		return _balances[who];
	}
	function allowance(address owner, address spender) external constant returns (uint256 remaining) {
		return 0;
	}

	function transfer(address to, uint256 value) external returns (bool success) {
		require(_balances[msg.sender] >= value);
		_balances[msg.sender] -= value;
		_balances[to] += value;
		return true;
	}
	function transferFrom(address from, address to, uint256 value) external returns (bool success) {
		assert(false);
	}
	function approve(address spender, uint256 value) external returns (bool success) {
		assert(false);
	}
}
