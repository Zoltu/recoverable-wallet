pragma solidity 0.4.20;

contract Erc20Token {
	function transfer(address recipient, uint256 amount) external returns (bool success);
	function approve(address spender, uint256 value) external returns (bool success);
}

contract RecoverableWalletFactory {
	event WalletCreated(address indexed owner);

	mapping(address => RecoverableWallet) public wallets;

	function createWallet(uint8 recoveryDelayInDays) external returns (RecoverableWallet) {
		require(wallets[msg.sender] == address(0) || wallets[msg.sender].owner() != msg.sender);
		wallets[msg.sender] = new RecoverableWallet(msg.sender);
		WalletCreated(msg.sender);
		return wallets[msg.sender];
	}

	// CONSIDER: add a mechanism such that when a wallet changes owners, this mapping is updated; this may require a map => set since a user could change ownership to an account that already has a wallet
}

contract Ownable {
	event OwnerChanged(address indexed oldOwner, address indexed newOwner);

	address public owner;

	function Ownable(address initialOwner) {
		require(initialOwner != address(0));
		owner = initialOwner;
	}

	modifier onlyOwner() {
		require(msg.sender == owner);
		_;
	}

	function transferOwnership(address newOwner) external onlyOwner {
		require(newOwner != address(0));
		address oldOwner = owner;
		owner = newOwner;
		OwnerChanged(oldOwner, owner);
	}
}

contract Claimable is Ownable {
	event OwnershipTransferStarted(address indexed oldOwner, address indexed newOwner);
	event OwnershipTransferFinished(address indexed oldOwner, address indexed newOwner);
	event OwnershipTransferCancelled(address indexed owner, address indexed pendingOwner);

	address public pendingOwner;

	modifier onlyPendingOwner() {
		require(msg.sender == pendingOwner);
		_;
	}

	function Claimable(address initialOwner) Ownable(initialOwner) {}

	function transferOwnership(address newOwner) external onlyOwner {
		require(newOwner != address(0));
		pendingOwner = newOwner;
		OwnershipTransferStarted(owner, pendingOwner);
	}

	function cancelOwnershipTransfer() external onlyOwner {
		pendingOwner = address(0);
		OwnershipTransferCancelled(owner, pendingOwner);
	}

	function claimOwnership() external onlyPendingOwner {
		address oldOwner = owner;
		owner = pendingOwner;
		pendingOwner = address(0);
		OwnershipTransferFinished(oldOwner, owner);
	}
}

contract RecoverableWallet is Claimable {
	event RecoveryAddressAdded(address indexed newRecoverer, uint256 recoveryDelayInDays);
	event RecoveryAddressRemoved(address indexed oldRecoverer);
	event RecoveryStarted(address indexed newOwner);
	event RecoveryCancelled();
	event RecoveryFinished(address indexed newPendingOwner);

	mapping(address => uint8) public recoveryAddresses;
	address public activeRecoveryAddress;
	uint256 public activeRecoveryEndTime;

	function RecoverableWallet(address initialOwner) Claimable(initialOwner) { }

	function () external payable { }

	function addRecoveryAddress(address newRecoveryAddress, uint8 recoveryDelayInDays) external onlyOwner {
		recoveryAddresses[newRecoveryAddress] = recoveryDelayInDays;
		RecoveryAddressAdded(newRecoveryAddress, recoveryDelayInDays);
	}

	function removeRecoveryAddress(address oldRecoveryAddress) external onlyOwner {
		recoveryAddresses[oldRecoveryAddress] = address(0);
		RecoveryAddressRemoved(oldRecoveryAddress);
	}

	function startRecovery() external {
		require(recoveryAddresses[msg.sender] != 0);
		require(activeRecoveryAddress == address(0) || recoveryAddresses[msg.sender] < recoveryAddresses[activeRecoveryAddress]);

		activeRecoveryAddress = msg.sender;
		activeRecoveryEndTime = block.timestamp + recoveryAddresses[msg.sender] * 1 days;
		RecoveryStarted(newOwnerAddress);
	}

	function cancelRecovery() external onlyOwner {
		activeRecoveryAddress = address(0);
		activeRecoveryEndTime = 0;
		RecoveryCancelled();
	}

	function finishRecovery() external {
		require(activeRecoveryAddress != address(0));
		require(block.timestamp > activeRecoveryEndTime);

		pendingOwner = activeRecoveryAddress;
		activeRecoveryAddress = address(0);
		activeRecoveryEndTime = 0;
		RecoveryFinished(pendingOwner);
	}

	function sendEther(address destination, uint256 amount) external onlyOwner {
		require(destination.call.value(amount)());
	}

	function sendToken(address tokenAddress, address destination, uint256 amount) external onlyOwner {
		Erc20Token token = Erc20Token(tokenAddress);
		require(token.transfer(destination, amount));
	}

	function approveToken(address tokenAddress, address spender, uint256 amount) external onlyOwner {
		Erc20Token token = Erc20Token(tokenAddress);
		require(token.approve(spender, amount));
	}

	// CONSIDER: allow calling arbitrary contracts by owner
}
