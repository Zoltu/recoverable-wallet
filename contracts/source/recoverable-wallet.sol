pragma solidity 0.5.8;

contract Token {
	function transfer(address recipient, uint256 amount) external returns (bool success);
	function approve(address spender, uint256 value) external returns (bool success);
}

contract RecoverableWalletFactory {
	event WalletCreated(address indexed owner);

	mapping(address => RecoverableWallet) private _wallets;

	function createWallet(uint8 recoveryDelayInDays) external returns (RecoverableWallet) {
		require(_wallets[msg.sender] == RecoverableWallet(0) || _wallets[msg.sender]._owner() == msg.sender);
		RecoverableWallet newWallet = new RecoverableWallet(recoveryDelayInDays, msg.sender);
		_wallets[msg.sender] = newWallet;
		emit WalletCreated(msg.sender);
		return newWallet;
	}

	function getWalletFor(address walletOwner) external view returns (RecoverableWallet) {
		return _wallets[walletOwner];
	}
}

contract Ownable {
	event OwnerChanged(address indexed oldOwner, address indexed newOwner);

	address public _owner;

	constructor (address owner) public {
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
		emit OwnerChanged(oldOwner, _owner);
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

	constructor (address owner) public Ownable(owner) {}

	function transferOwnership(address newOwner) external onlyOwner {
		require(newOwner != address(0));
		_pendingOwner = newOwner;
		emit OwnershipTransferStarted(_owner, _pendingOwner);
	}

	function claimOwnership() external onlyPendingOwner {
		address oldOwner = _owner;
		_owner = _pendingOwner;
		_pendingOwner = address(0);
		emit OwnershipTransferFinished(oldOwner, _owner);
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

	constructor (uint8 recoveryDelayInDays, address owner) public Claimable(owner) {
		require(owner != address(0));
		_recoveryDelayDays = recoveryDelayInDays;
	}

	function () external payable { }

	function addRecoveryAddress(address newRecoveryAddress) external onlyOwner {
		_recoveryAddresses[newRecoveryAddress] = true;
		emit RecoveryAddressAdded(newRecoveryAddress);
	}

	function removeRecoveryAddress(address oldRecoveryAddress) external onlyOwner {
		_recoveryAddresses[oldRecoveryAddress] = false;
		emit RecoveryAddressRemoved(oldRecoveryAddress);
	}

	function startRecovery(address newOwnerAddress) external {
		require(_recoveryAddresses[msg.sender]);
		require(_activeRecoveryAddress == address(0));

		_activeRecoveryAddress = newOwnerAddress;
		_activeRecoveryStartTime = block.timestamp;
		emit RecoveryStarted(newOwnerAddress);
	}

	function cancelRecovery() external onlyOwner {
		_activeRecoveryAddress = address(0);
		_activeRecoveryStartTime = 0;
		emit RecoveryCancelled();
	}

	function finishRecovery() external {
		require(_activeRecoveryAddress != address(0));
		require(block.timestamp > _activeRecoveryStartTime + _recoveryDelayDays * 1 days);

		_pendingOwner = _activeRecoveryAddress;
		_activeRecoveryAddress = address(0);
		_activeRecoveryStartTime = 0;
		emit RecoveryFinished(_pendingOwner);
	}

	function sendEther(address payable destination, uint256 amount) external onlyOwner {
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
