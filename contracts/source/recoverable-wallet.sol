pragma solidity 0.5.8;

/// @notice https://eips.ethereum.org/EIPS/eip-1820
interface Erc1820Registry {
	function setInterfaceImplementer(address _target, bytes32 _interfaceHash, address _implementer) external;
}

/// @notice https://eips.ethereum.org/EIPS/eip-777
contract Erc777TokensRecipient {
	constructor() public {
		// keccak256(abi.encodePacked("ERC777TokensRecipient")) == 0xb281fc8c12954d22544db45de3159a39272895b169a852b314f9cc762e44c53b
		Erc1820Registry(0x1820a4B7618BdE71Dce8cdc73aAB6C95905faD24).setInterfaceImplementer(address(this), 0xb281fc8c12954d22544db45de3159a39272895b169a852b314f9cc762e44c53b, address(this));
	}

	/// @notice called when someone attempts to transfer ERC-777 tokens to this address.  If this function were to throw or doesn't exist, then the token transfer would fail.
	function tokensReceived(address, address, address, uint256, bytes calldata, bytes calldata) external { }

	/// @notice Indicates whether the contract implements the interface `interfaceHash` for the address `_implementer` or not.
	/// @param _interfaceHash keccak256 hash of the name of the interface
	/// @param _implementer Address for which the contract will implement the interface
	/// @return ERC1820_ACCEPT_MAGIC only if the contract implements `interfaceHash` for the address `_implementer`.
	function canImplementInterfaceForAddress(bytes32 _interfaceHash, address _implementer) external view returns(bytes32) {
		// keccak256(abi.encodePacked("ERC777TokensRecipient")) == 0xb281fc8c12954d22544db45de3159a39272895b169a852b314f9cc762e44c53b
		if (_implementer == address(this) && _interfaceHash == 0xb281fc8c12954d22544db45de3159a39272895b169a852b314f9cc762e44c53b) {
			// keccak256(abi.encodePacked("ERC1820_ACCEPT_MAGIC")) == 0xa2ef4600d742022d532d4747cb3547474667d6f13804902513b2ec01c848f4b4
			return 0xa2ef4600d742022d532d4747cb3547474667d6f13804902513b2ec01c848f4b4;
		} else {
			return bytes32(0);
		}
	}
}

/// @notice An Ownable contract is one that has a single address that has elevated control over the contract's operations.  Ownership can be transferred between users as a two-step process, one to initiate the transfer and two to receive the transfer.  This two-step process ensures that ownership cannot accidentally be given to an address that cannot operate the contract.
contract Ownable {
	event OwnershipTransferStarted(address indexed owner, address indexed pendingOwner);
	event OwnershipTransferCancelled(address indexed owner, address indexed pendingOwner);
	event OwnershipTransferFinished(address indexed oldOwner, address indexed newOwner);

	address public owner;
	address public pendingOwner;

	constructor(address _owner) public {
		require(_owner != address(0), "Contract must have an owner.");
		owner = _owner;
	}

	/// @notice a function modifier that ensures the modified function can only be called by the owner of the contract.
	modifier onlyOwner() {
		require(msg.sender == owner, "Only the owner may call this method.");
		_;
	}

	/// @notice starts the transfer of ownership to a new owner.
	/// @param _pendingOwner the address to which ownership should be transferred.
	function startOwnershipTransfer(address _pendingOwner) external onlyOwner {
		require(_pendingOwner != address(0), "Contract must have an owner.");
		// we want to ensure that we get a cancelled or finished event for every ownership transfer, so if a transfer is in progres we first cancel it
		if (pendingOwner != address(0)) {
			cancelOwnershipTransfer();
		}
		pendingOwner = _pendingOwner;
		emit OwnershipTransferStarted(owner, pendingOwner);
	}

	/// @notice cancel an in progress ownership transfer.
	/// @dev cancellation should not be depended on to cancel a transfer to a malicious address.  it's intended purpose is only to cancel transfer to an address that is unable or unwilling to accept the transfer
	function cancelOwnershipTransfer() public onlyOwner {
		require(pendingOwner != address(0), "There is no pending transfer to be cancelled.");
		address _pendingOwner = pendingOwner;
		pendingOwner = address(0);
		emit OwnershipTransferCancelled(owner, _pendingOwner);
	}

	/// @notice called by the pending owner as part of the two-step ownership transfer process to accept ownership of the contract.
	function acceptOwnership() external {
		require(msg.sender == pendingOwner, "Only the pending owner can call this method.");
		address _oldOwner = owner;
		owner = pendingOwner;
		pendingOwner = address(0);
		emit OwnershipTransferFinished(_oldOwner, owner);
	}
}

/// @notice a smart wallet that is secured against loss of keys by way of backup keys that can be used to recover access with a time delay.
contract RecoverableWallet is Ownable, Erc777TokensRecipient {
	event RecoveryAddressAdded(address indexed newRecoverer, uint16 recoveryDelayInDays);
	event RecoveryAddressRemoved(address indexed oldRecoverer);
	event RecoveryStarted(address indexed newOwner);
	event RecoveryCancelled(address indexed oldRecoverer);
	event RecoveryFinished(address indexed newPendingOwner);

	/// @notice a collection of accounts that are able to recover control of this wallet, mapped to the number of days it takes for each to complete a recovery.
	/// @dev the recovery days are also used as a recovery priority, so a recovery address with a lower number of days has a higher recovery priority and can override a lower-priority recovery in progress.
	mapping(address => uint16) public recoveryDelaysInDays;
	address public activeRecoveryAddress;
	uint256 public activeRecoveryEndTime = uint256(-1);

	/// @notice the modified function can only be called when the wallet is undergoing recovery.
	modifier onlyDuringRecovery() {
		require(activeRecoveryAddress != address(0), "This method can only be called during a recovery.");
		_;
	}

	/// @notice the modified function can only be called when the wallet is not undergoing recovery.
	modifier onlyOutsideRecovery() {
		require(activeRecoveryAddress == address(0), "This method cannot be called during a recovery.");
		_;
	}

	constructor(address _initialOwner) Ownable(_initialOwner) public { }

	/// @notice accept ETH transfers into this contract
	function () external payable { }

	/// @notice add a new recovery address to the wallet with the specified number of day delay
	/// @param _newRecoveryAddress the address to be added
	/// @param _recoveryDelayInDays the number of days delay between when `_newRecoveryAddress` can initiate a recovery and when it can complete the recovery
	function addRecoveryAddress(address _newRecoveryAddress, uint16 _recoveryDelayInDays) external onlyOwner onlyOutsideRecovery {
		require(_newRecoveryAddress != address(0), "Recovery address must be supplied.");
		require(_recoveryDelayInDays > 0, "Recovery delay must be at least 1 day.");
		recoveryDelaysInDays[_newRecoveryAddress] = _recoveryDelayInDays;
		emit RecoveryAddressAdded(_newRecoveryAddress, _recoveryDelayInDays);
	}

	/// @notice removes a recovery address from the collection, preventing it from being able to issue recovery operations in the future
	/// @param _oldRecoveryAddress the address to remove from the recovery addresses collection
	function removeRecoveryAddress(address _oldRecoveryAddress) public onlyOwner onlyOutsideRecovery {
		require(_oldRecoveryAddress != address(0), "Recovery address must be supplied.");
		recoveryDelaysInDays[_oldRecoveryAddress] = 0;
		emit RecoveryAddressRemoved(_oldRecoveryAddress);
	}

	/// @notice starts the recovery process.  must be called by a previously registered recovery address.  recovery will complete in a number of days dependent on the address that initiated the recovery
	function startRecovery() external {
		uint16 _proposedRecoveryDelayInDays = recoveryDelaysInDays[msg.sender];
		require(_proposedRecoveryDelayInDays != 0, "Only designated recovery addresseses can initiate the recovery process.");

		bool _inRecovery = activeRecoveryAddress != address(0);
		if (_inRecovery) {
			// NOTE: the delay for a particular recovery address cannot be changed during recovery nor can addresses be removed during recovery, so we can rely on this being != 0
			uint16 _activeRecoveryDelayInDays = recoveryDelaysInDays[activeRecoveryAddress];
			require(_proposedRecoveryDelayInDays < _activeRecoveryDelayInDays, "Recovery is already under way and new recovery doesn't have a higher priority.");
			emit RecoveryCancelled(activeRecoveryAddress);
		}

		activeRecoveryAddress = msg.sender;
		activeRecoveryEndTime = block.timestamp + _proposedRecoveryDelayInDays * 1 days;
		emit RecoveryStarted(msg.sender);
	}

	/// @notice cancels an active recovery.  can only be called by the current contract owner.  used to cancel a recovery in case the owner key is found
	/// @dev cancellation is only reliable if the recovery time has not elapsed
	function cancelRecovery() public onlyOwner onlyDuringRecovery {
		address _recoveryAddress = activeRecoveryAddress;
		resetRecovery();
		emit RecoveryCancelled(_recoveryAddress);
	}

	/// @notice cancels an active recovery and removes the recovery address from the recoverer collection.  used when a recovery key becomes compromised and attempts to initiate a recovery
	function cancelRecoveryAndRemoveRecoveryAddress() external onlyOwner onlyDuringRecovery {
		address _recoveryAddress = activeRecoveryAddress;
		cancelRecovery();
		removeRecoveryAddress(_recoveryAddress);
	}

	/// @notice finishes the recovery process after the necessary delay has elapsed.  callable by anyone in case the keys controlling the active recovery address have been lost, since once this is called a new recovery (with a potentially lower recovery priority) can begin.
	function finishRecovery() external onlyDuringRecovery {
		require(block.timestamp > activeRecoveryEndTime, "You must wait until the recovery delay is over before finishing the recovery.");

		address _oldOwner = owner;
		owner = activeRecoveryAddress;
		resetRecovery();
		emit RecoveryFinished(pendingOwner);
		emit OwnershipTransferStarted(_oldOwner, owner);
		emit OwnershipTransferFinished(_oldOwner, owner);
	}

	/// @notice deploy a contract from this contract.
	/// @dev uses create2, so the address of the deployed contract will be deterministic
	/// @param _value the amount of ETH that should be supplied to the contract creation call
	/// @param _data the deployment bytecode to execute
	/// @param _salt the salt used for deterministic contract creation.  see documentation at https://eips.ethereum.org/EIPS/eip-1014 for details on how the address is computed
	function deploy(uint256 _value, bytes calldata _data, uint256 _salt) external payable onlyOwner onlyOutsideRecovery returns (address) {
		require(address(this).balance >= _value, "Wallet does not have enough funds available to deploy the contract.");
		require(_data.length != 0, "Contract deployment must contain bytecode to deploy.");
		bytes memory _data2 = _data;
		address newContract;
		/* solium-disable-next-line */
		assembly { newContract := create2(_value, add(_data2, 32), mload(_data2), _salt) }
		require(newContract != address(0), "Contract creation returned address 0, indicating failure.");
		return newContract;
	}

	/// @notice executes an arbitrary contract call by this wallet.  allows the wallet to send ETH, transfer tokens, use dapps, etc.
	/// @param _to contract address to call or send to
	/// @param _value the amount of ETH to attach to the call
	/// @param _data the calldata to supply to `_to`
	/// @dev `_data` is of the same form used to call a contract from the JSON-RPC API, so for Solidity contract calls it is the target function hash followed by the ABI encoded parameters for that function
	function execute(address payable _to, uint256 _value, bytes calldata _data) external payable onlyOwner onlyOutsideRecovery returns (bytes memory) {
		require(_to != address(0), "Transaction execution must contain a destination.  If you meant to deploy a contract, use deploy instead.");
		require(address(this).balance >= _value, "Wallet does not have enough funds available to execute the desired transaction.");
		(bool _success, bytes memory _result) = _to.call.value(_value)(_data);
		require(_success, "Contract execution failed.");
		return _result;
	}

	function resetRecovery() private {
		activeRecoveryAddress = address(0);
		activeRecoveryEndTime = uint256(-1);
	}
}

/// @notice A factory for creating new recoverable wallets.  this is useful because an event is fired anytime a wallet is created with this factory, so we can track all wallets created by this by monitoring contract events
contract RecoverableWalletFactory {
	event WalletCreated(address indexed owner, RecoverableWallet indexed wallet);

	/// @notice creates a new recoverable wallet that is initially owned by the caller
	function createWallet() external returns (RecoverableWallet) {
		RecoverableWallet wallet = new RecoverableWallet(msg.sender);
		emit WalletCreated(msg.sender, wallet);
		return wallet;
	}

	/// @notice this function makes it so one can easily identify whether this contract has been deployed or not.  deployment of this factory is done deterministically, so it will live at a well known address on every chain but the user may need to check whether or not this contract has been deployed yet on a given chain
	function exists() external pure returns (bytes32) {
		return 0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef;
	}
}
