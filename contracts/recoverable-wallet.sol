pragma solidity 0.4.10;

contract Erc20Token {
	function transfer(address recipient, uint256 amount) external returns (bool success);
	function approve(address spender, uint256 value) external returns (bool success);
}

contract RecoverableWalletFactory {
	event WalletCreated(address indexed owner);

	mapping(address => RecoverableWallet) private _wallets;

	function createWallet(uint8 recoveryDelayInDays) external returns (RecoverableWallet) {
		require(_wallets[msg.sender] == address(0) || _wallets[msg.sender]._owner() == msg.sender);
		RecoverableWallet newWallet = new RecoverableWallet(msg.sender);
		_wallets[msg.sender] = newWallet;
		WalletCreated(msg.sender);
		return newWallet;
	}

	function getWalletFor(address walletOwner) external constant returns (RecoverableWallet) {
		return _wallets[walletOwner];
	}

	// TODO: add a mechanism such that when a wallet changes owners, this mapping is updated; this may require a map => set since a user could change ownership to an account that already has a wallet
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
	event RecoveryAddressAdded(address indexed newRecoverer, uint256 recoveryDelayInDays);
	event RecoveryAddressRemoved(address indexed oldRecoverer);
	event RecoveryStarted(address indexed newOwner);
	event RecoveryCancelled();
	event RecoveryFinished(address indexed newPendingOwner);

	mapping(address => uint8) public _recoveryAddresses;
	address public _activeRecoveryAddress;
	uint256 public _activeRecoveryEndTime;

	function RecoverableWallet(address owner) Claimable(owner) {
		require(owner != address(0));
	}

	function () external payable { }

	function addRecoveryAddress(address newRecoveryAddress, uint8 recoveryDelayInDays) external onlyOwner {
		_recoveryAddresses[newRecoveryAddress] = recoveryDelayInDays;
		RecoveryAddressAdded(newRecoveryAddress, recoveryDelayInDays);
	}

	function removeRecoveryAddress(address oldRecoveryAddress) external onlyOwner {
		_recoveryAddresses[oldRecoveryAddress] = 0;
		RecoveryAddressRemoved(oldRecoveryAddress);
	}

	function startRecovery(address newOwnerAddress) external {
		require(_recoveryAddresses[msg.sender] != 0);
		require(_activeRecoveryAddress == address(0) || _recoveryAddresses[msg.sender] < _recoveryAddresses[_activeRecoveryAddress]);

		_activeRecoveryAddress = newOwnerAddress;
		_activeRecoveryEndTime = block.timestamp + _recoveryAddresses[msg.sender] * 1 days;
		RecoveryStarted(newOwnerAddress);
	}

	function cancelRecovery() external onlyOwner {
		_activeRecoveryAddress = address(0);
		_activeRecoveryEndTime = 0;
		RecoveryCancelled();
	}

	function finishRecovery() external {
		require(_activeRecoveryAddress != address(0));
		require(block.timestamp > _activeRecoveryEndTime);

		_pendingOwner = _activeRecoveryAddress;
		_activeRecoveryAddress = address(0);
		_activeRecoveryEndTime = 0;
		RecoveryFinished(_pendingOwner);
	}

	function sendEther(address destination, uint256 amount) external onlyOwner {
		destination.transfer(amount);
	}

	function sendToken(address tokenAddress, address destination, uint256 amount) external onlyOwner {
		Token token = Erc20Token(tokenAddress);
		require(token.transfer(destination, amount));
	}

	function approveToken(address tokenAddress, address spender, uint256 amount) external onlyOwner {
		Token token = Erc20Token(tokenAddress);
		require(token.approve(spender, amount));
	}

	// TODO: allow calling arbitrary contracts by owner
}
