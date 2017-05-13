pragma solidity 0.4.10;

contract Token {
	event Transfer(address indexed from, address indexed to, uint256 value);
	event Approval(address indexed owner, address indexed spender, uint256 value);

	function totalSupply() external constant returns (uint256 totalSupply);
	function balanceOf(address who) external constant returns (uint256 balance);
	function allowance(address owner, address spender) external constant returns (uint256 remaining);

	function transfer(address to, uint256 value) external returns (bool success);
	function transferFrom(address from, address to, uint256 value) external returns (bool success);
	function approve(address spender, uint256 value) external returns (bool success);
}
