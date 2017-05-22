pragma solidity 0.4.10;

contract Token {
	function transfer(address recipient, uint256 amount) external returns (bool success);
	function approve(address spender, uint256 value) external returns (bool success);
}

contract RecoverableWalletFactory {
	event WalletCreated(address indexed owner);

	mapping(address => RecoverableWallet) private _wallets;

	function createWallet(uint8 recoveryDelayInDays) external returns (RecoverableWallet) {
		require(_wallets[msg.sender] == address(0) || _wallets[msg.sender].getOwner() == msg.sender);
		RecoverableWallet newWallet = new RecoverableWallet(recoveryDelayInDays, msg.sender);
		_wallets[msg.sender] = newWallet;
		WalletCreated(msg.sender);
		return newWallet;
	}

	function getWalletFor(address walletOwner) external constant returns (RecoverableWallet) {
		return _wallets[walletOwner];
	}
}

contract Ownable {
	address public _owner;

	function Ownable(address owner) {
		_owner = owner;
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

contract Claimable is Ownable {
	address internal _pendingOwner;

	modifier onlyPendingOwner() {
		require(msg.sender == _pendingOwner);
		_;
	}

	function Claimable(address owner) Ownable(owner) {}

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

contract RecoverableWallet is Claimable {
	event RecoveryStarted(address indexed initiator, address indexed newOwner);

	mapping(address => address) private _recoveryAddresses;
	address private _activeRecoveryAddress;
	uint256 private _activeRecoveryStartTime;
	uint8 private _recoveryDelayDays;

	function RecoverableWallet(uint8 recoveryDelayInDays, address owner) Claimable(owner) {
		require(owner != address(0));
		_recoveryDelayDays = recoveryDelayInDays;
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
