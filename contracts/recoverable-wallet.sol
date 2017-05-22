pragma solidity 0.4.10;

contract Token {
	function transfer(address recipient, uint256 amount) external returns (bool success);
	function approve(address spender, uint256 value) external returns (bool success);
}

contract RecoverableWalletFactory {
	event WalletCreated(address indexed owner);

	mapping(address => RecoverableWallet) private _wallets;

	function createWallet(uint8 recoveryDelayInDays) external returns (RecoverableWallet) {
		require(_wallets[msg.sender] == address(0) || _wallets[msg.sender]._owner() == msg.sender);
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
	event OwnerChanged(address indexed oldOwner, address indexed newOwner);

	address public _owner;

	function Ownable(address owner) {
		_owner = owner;
	}

	modifier onlyOwner() {
		require(msg.sender == _owner);
		_;
	}

	function transferOwnership(address newOwner) external onlyOwner {
		require(newOwner != address(0));
		address oldOwner = _owner;
		_owner = newOwner;
		OwnerChanged(oldOwner, _owner);
	}
}

contract Claimable is Ownable {
	event OwnershipTransferStarted(address indexed oldOwner, address indexed newOwner);
	event OwnershipTransferFinished(address indexed oldOwner, address indexed newOwner);

	address public _pendingOwner;

	modifier onlyPendingOwner() {
		require(msg.sender == _pendingOwner);
		_;
	}

	function Claimable(address owner) Ownable(owner) {}

	function transferOwnership(address newOwner) external onlyOwner {
		require(newOwner != address(0));
		_pendingOwner = newOwner;
		OwnershipTransferStarted(_owner, _pendingOwner);
	}

	function claimOwnership() external onlyPendingOwner {
		address oldOwner = _owner;
		_owner = _pendingOwner;
		_pendingOwner = address(0);
		OwnershipTransferFinished(oldOwner, _owner);
	}
}

contract RecoverableWallet is Claimable {
	event RecoveryAddressAdded(address indexed newRecoverer);
	event RecoveryAddressRemoved(address indexed oldRecoverer);
	event RecoveryStarted(address indexed newOwner);
	event RecoveryCancelled();
	event RecoveryFinished(address indexed newOwner);

	mapping(address => bool) public _recoveryAddresses;
	address public _activeRecoveryAddress;
	uint256 public _activeRecoveryStartTime;
	uint8 public _recoveryDelayDays;

	function RecoverableWallet(uint8 recoveryDelayInDays, address owner) Claimable(owner) {
		require(owner != address(0));
		_recoveryDelayDays = recoveryDelayInDays;
	}

	function () external payable { }

	function addRecoveryAddress(address newRecoveryAddress) external onlyOwner {
		_recoveryAddresses[newRecoveryAddress] = true;
		RecoveryAddressAdded(newRecoveryAddress);
	}

	function removeRecoveryAddress(address oldRecoveryAddress) external onlyOwner {
		_recoveryAddresses[oldRecoveryAddress] = false;
		RecoveryAddressRemoved(oldRecoveryAddress);
	}

	function startRecovery(address newOwnerAddress) external {
		require(_recoveryAddresses[msg.sender]);
		require(_activeRecoveryAddress == address(0));

		_activeRecoveryAddress = newOwnerAddress;
		_activeRecoveryStartTime = block.timestamp;
		RecoveryStarted(newOwnerAddress);
	}

	function cancelRecovery() external onlyOwner {
		_activeRecoveryAddress = address(0);
		_activeRecoveryStartTime = 0;
		RecoveryCancelled();
	}

	function finishRecovery() external {
		require(_activeRecoveryAddress != address(0));
		require(block.timestamp > _activeRecoveryStartTime + _recoveryDelayDays * 1 days);

		_pendingOwner = _activeRecoveryAddress;
		_activeRecoveryAddress = address(0);
		_activeRecoveryStartTime = 0;
		RecoveryFinished(_pendingOwner);
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
