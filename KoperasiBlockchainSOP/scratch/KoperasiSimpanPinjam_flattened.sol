// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// File: @openzeppelin\contracts\utils\StorageSlot.sol
// OpenZeppelin Contracts (last updated v5.1.0) (utils/StorageSlot.sol)
// This file was procedurally generated from scripts/generate/templates/StorageSlot.js.


/**
 * @dev Library for reading and writing primitive types to specific storage slots.
 *
 * Storage slots are often used to avoid storage conflict when dealing with upgradeable contracts.
 * This library helps with reading and writing to such slots without the need for inline assembly.
 *
 * The functions in this library return Slot structs that contain a `value` member that can be used to read or write.
 *
 * Example usage to set ERC-1967 implementation slot:
 * ```solidity
 * contract ERC1967 {
 *     // Define the slot. Alternatively, use the SlotDerivation library to derive the slot.
 *     bytes32 internal constant _IMPLEMENTATION_SLOT = 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;
 *
 *     function _getImplementation() internal view returns (address) {
 *         return StorageSlot.getAddressSlot(_IMPLEMENTATION_SLOT).value;
 *     }
 *
 *     function _setImplementation(address newImplementation) internal {
 *         require(newImplementation.code.length > 0);
 *         StorageSlot.getAddressSlot(_IMPLEMENTATION_SLOT).value = newImplementation;
 *     }
 * }
 * ```
 *
 * TIP: Consider using this library along with {SlotDerivation}.
 */
library StorageSlot {
    struct AddressSlot {
        address value;
    }

    struct BooleanSlot {
        bool value;
    }

    struct Bytes32Slot {
        bytes32 value;
    }

    struct Uint256Slot {
        uint256 value;
    }

    struct Int256Slot {
        int256 value;
    }

    struct StringSlot {
        string value;
    }

    struct BytesSlot {
        bytes value;
    }

    /**
     * @dev Returns an `AddressSlot` with member `value` located at `slot`.
     */
    function getAddressSlot(bytes32 slot) internal pure returns (AddressSlot storage r) {
        assembly ("memory-safe") {
            r.slot := slot
        }
    }

    /**
     * @dev Returns a `BooleanSlot` with member `value` located at `slot`.
     */
    function getBooleanSlot(bytes32 slot) internal pure returns (BooleanSlot storage r) {
        assembly ("memory-safe") {
            r.slot := slot
        }
    }

    /**
     * @dev Returns a `Bytes32Slot` with member `value` located at `slot`.
     */
    function getBytes32Slot(bytes32 slot) internal pure returns (Bytes32Slot storage r) {
        assembly ("memory-safe") {
            r.slot := slot
        }
    }

    /**
     * @dev Returns a `Uint256Slot` with member `value` located at `slot`.
     */
    function getUint256Slot(bytes32 slot) internal pure returns (Uint256Slot storage r) {
        assembly ("memory-safe") {
            r.slot := slot
        }
    }

    /**
     * @dev Returns a `Int256Slot` with member `value` located at `slot`.
     */
    function getInt256Slot(bytes32 slot) internal pure returns (Int256Slot storage r) {
        assembly ("memory-safe") {
            r.slot := slot
        }
    }

    /**
     * @dev Returns a `StringSlot` with member `value` located at `slot`.
     */
    function getStringSlot(bytes32 slot) internal pure returns (StringSlot storage r) {
        assembly ("memory-safe") {
            r.slot := slot
        }
    }

    /**
     * @dev Returns an `StringSlot` representation of the string storage pointer `store`.
     */
    function getStringSlot(string storage store) internal pure returns (StringSlot storage r) {
        assembly ("memory-safe") {
            r.slot := store.slot
        }
    }

    /**
     * @dev Returns a `BytesSlot` with member `value` located at `slot`.
     */
    function getBytesSlot(bytes32 slot) internal pure returns (BytesSlot storage r) {
        assembly ("memory-safe") {
            r.slot := slot
        }
    }

    /**
     * @dev Returns an `BytesSlot` representation of the bytes storage pointer `store`.
     */
    function getBytesSlot(bytes storage store) internal pure returns (BytesSlot storage r) {
        assembly ("memory-safe") {
            r.slot := store.slot
        }
    }
}


// File: @openzeppelin\contracts\utils\ReentrancyGuard.sol
// OpenZeppelin Contracts (last updated v5.5.0) (utils/ReentrancyGuard.sol)



/**
 * @dev Contract module that helps prevent reentrant calls to a function.
 *
 * Inheriting from `ReentrancyGuard` will make the {nonReentrant} modifier
 * available, which can be applied to functions to make sure there are no nested
 * (reentrant) calls to them.
 *
 * Note that because there is a single `nonReentrant` guard, functions marked as
 * `nonReentrant` may not call one another. This can be worked around by making
 * those functions `private`, and then adding `external` `nonReentrant` entry
 * points to them.
 *
 * TIP: If EIP-1153 (transient storage) is available on the chain you're deploying at,
 * consider using {ReentrancyGuardTransient} instead.
 *
 * TIP: If you would like to learn more about reentrancy and alternative ways
 * to protect against it, check out our blog post
 * https://blog.openzeppelin.com/reentrancy-after-istanbul/[Reentrancy After Istanbul].
 *
 * IMPORTANT: Deprecated. This storage-based reentrancy guard will be removed and replaced
 * by the {ReentrancyGuardTransient} variant in v6.0.
 *
 * @custom:stateless
 */
abstract contract ReentrancyGuard {
    using StorageSlot for bytes32;

    // keccak256(abi.encode(uint256(keccak256("openzeppelin.storage.ReentrancyGuard")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 private constant REENTRANCY_GUARD_STORAGE =
        0x9b779b17422d0df92223018b32b4d1fa46e071723d6817e2486d003becc55f00;

    // Booleans are more expensive than uint256 or any type that takes up a full
    // word because each write operation emits an extra SLOAD to first read the
    // slot's contents, replace the bits taken up by the boolean, and then write
    // back. This is the compiler's defense against contract upgrades and
    // pointer aliasing, and it cannot be disabled.

    // The values being non-zero value makes deployment a bit more expensive,
    // but in exchange the refund on every call to nonReentrant will be lower in
    // amount. Since refunds are capped to a percentage of the total
    // transaction's gas, it is best to keep them low in cases like this one, to
    // increase the likelihood of the full refund coming into effect.
    uint256 private constant NOT_ENTERED = 1;
    uint256 private constant ENTERED = 2;

    /**
     * @dev Unauthorized reentrant call.
     */
    error ReentrancyGuardReentrantCall();

    constructor() {
        _reentrancyGuardStorageSlot().getUint256Slot().value = NOT_ENTERED;
    }

    /**
     * @dev Prevents a contract from calling itself, directly or indirectly.
     * Calling a `nonReentrant` function from another `nonReentrant`
     * function is not supported. It is possible to prevent this from happening
     * by making the `nonReentrant` function external, and making it call a
     * `private` function that does the actual work.
     */
    modifier nonReentrant() {
        _nonReentrantBefore();
        _;
        _nonReentrantAfter();
    }

    /**
     * @dev A `view` only version of {nonReentrant}. Use to block view functions
     * from being called, preventing reading from inconsistent contract state.
     *
     * CAUTION: This is a "view" modifier and does not change the reentrancy
     * status. Use it only on view functions. For payable or non-payable functions,
     * use the standard {nonReentrant} modifier instead.
     */
    modifier nonReentrantView() {
        _nonReentrantBeforeView();
        _;
    }

    function _nonReentrantBeforeView() private view {
        if (_reentrancyGuardEntered()) {
            revert ReentrancyGuardReentrantCall();
        }
    }

    function _nonReentrantBefore() private {
        // On the first call to nonReentrant, _status will be NOT_ENTERED
        _nonReentrantBeforeView();

        // Any calls to nonReentrant after this point will fail
        _reentrancyGuardStorageSlot().getUint256Slot().value = ENTERED;
    }

    function _nonReentrantAfter() private {
        // By storing the original value once again, a refund is triggered (see
        // https://eips.ethereum.org/EIPS/eip-2200)
        _reentrancyGuardStorageSlot().getUint256Slot().value = NOT_ENTERED;
    }

    /**
     * @dev Returns true if the reentrancy guard is currently set to "entered", which indicates there is a
     * `nonReentrant` function in the call stack.
     */
    function _reentrancyGuardEntered() internal view returns (bool) {
        return _reentrancyGuardStorageSlot().getUint256Slot().value == ENTERED;
    }

    function _reentrancyGuardStorageSlot() internal pure virtual returns (bytes32) {
        return REENTRANCY_GUARD_STORAGE;
    }
}


// File: @openzeppelin\contracts\token\ERC20\IERC20.sol
// OpenZeppelin Contracts (last updated v5.4.0) (token/ERC20/IERC20.sol)


/**
 * @dev Interface of the ERC-20 standard as defined in the ERC.
 */
interface IERC20 {
    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
     * a call to {approve}. `value` is the new allowance.
     */
    event Approval(address indexed owner, address indexed spender, uint256 value);

    /**
     * @dev Returns the value of tokens in existence.
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Returns the value of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Moves a `value` amount of tokens from the caller's account to `to`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address to, uint256 value) external returns (bool);

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(address owner, address spender) external view returns (uint256);

    /**
     * @dev Sets a `value` amount of tokens as the allowance of `spender` over the
     * caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * IMPORTANT: Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an {Approval} event.
     */
    function approve(address spender, uint256 value) external returns (bool);

    /**
     * @dev Moves a `value` amount of tokens from `from` to `to` using the
     * allowance mechanism. `value` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}


// File: @openzeppelin\contracts\token\ERC20\extensions\IERC20Metadata.sol
// OpenZeppelin Contracts (last updated v5.4.0) (token/ERC20/extensions/IERC20Metadata.sol)



/**
 * @dev Interface for the optional metadata functions from the ERC-20 standard.
 */
interface IERC20Metadata is IERC20 {
    /**
     * @dev Returns the name of the token.
     */
    function name() external view returns (string memory);

    /**
     * @dev Returns the symbol of the token.
     */
    function symbol() external view returns (string memory);

    /**
     * @dev Returns the decimals places of the token.
     */
    function decimals() external view returns (uint8);
}


// File: @openzeppelin\contracts\utils\Context.sol
// OpenZeppelin Contracts (last updated v5.0.1) (utils/Context.sol)


/**
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they should not be accessed in such a direct
 * manner, since when dealing with meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 *
 * This contract is only required for intermediate, library-like contracts.
 */
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }

    function _contextSuffixLength() internal view virtual returns (uint256) {
        return 0;
    }
}


// File: @openzeppelin\contracts\interfaces\draft-IERC6093.sol
// OpenZeppelin Contracts (last updated v5.5.0) (interfaces/draft-IERC6093.sol)


/**
 * @dev Standard ERC-20 Errors
 * Interface of the https://eips.ethereum.org/EIPS/eip-6093[ERC-6093] custom errors for ERC-20 tokens.
 */
interface IERC20Errors {
    /**
     * @dev Indicates an error related to the current `balance` of a `sender`. Used in transfers.
     * @param sender Address whose tokens are being transferred.
     * @param balance Current balance for the interacting account.
     * @param needed Minimum amount required to perform a transfer.
     */
    error ERC20InsufficientBalance(address sender, uint256 balance, uint256 needed);

    /**
     * @dev Indicates a failure with the token `sender`. Used in transfers.
     * @param sender Address whose tokens are being transferred.
     */
    error ERC20InvalidSender(address sender);

    /**
     * @dev Indicates a failure with the token `receiver`. Used in transfers.
     * @param receiver Address to which tokens are being transferred.
     */
    error ERC20InvalidReceiver(address receiver);

    /**
     * @dev Indicates a failure with the `spender`’s `allowance`. Used in transfers.
     * @param spender Address that may be allowed to operate on tokens without being their owner.
     * @param allowance Amount of tokens a `spender` is allowed to operate with.
     * @param needed Minimum amount required to perform a transfer.
     */
    error ERC20InsufficientAllowance(address spender, uint256 allowance, uint256 needed);

    /**
     * @dev Indicates a failure with the `approver` of a token to be approved. Used in approvals.
     * @param approver Address initiating an approval operation.
     */
    error ERC20InvalidApprover(address approver);

    /**
     * @dev Indicates a failure with the `spender` to be approved. Used in approvals.
     * @param spender Address that may be allowed to operate on tokens without being their owner.
     */
    error ERC20InvalidSpender(address spender);
}

/**
 * @dev Standard ERC-721 Errors
 * Interface of the https://eips.ethereum.org/EIPS/eip-6093[ERC-6093] custom errors for ERC-721 tokens.
 */
interface IERC721Errors {
    /**
     * @dev Indicates that an address can't be an owner. For example, `address(0)` is a forbidden owner in ERC-721.
     * Used in balance queries.
     * @param owner Address of the current owner of a token.
     */
    error ERC721InvalidOwner(address owner);

    /**
     * @dev Indicates a `tokenId` whose `owner` is the zero address.
     * @param tokenId Identifier number of a token.
     */
    error ERC721NonexistentToken(uint256 tokenId);

    /**
     * @dev Indicates an error related to the ownership over a particular token. Used in transfers.
     * @param sender Address whose tokens are being transferred.
     * @param tokenId Identifier number of a token.
     * @param owner Address of the current owner of a token.
     */
    error ERC721IncorrectOwner(address sender, uint256 tokenId, address owner);

    /**
     * @dev Indicates a failure with the token `sender`. Used in transfers.
     * @param sender Address whose tokens are being transferred.
     */
    error ERC721InvalidSender(address sender);

    /**
     * @dev Indicates a failure with the token `receiver`. Used in transfers.
     * @param receiver Address to which tokens are being transferred.
     */
    error ERC721InvalidReceiver(address receiver);

    /**
     * @dev Indicates a failure with the `operator`’s approval. Used in transfers.
     * @param operator Address that may be allowed to operate on tokens without being their owner.
     * @param tokenId Identifier number of a token.
     */
    error ERC721InsufficientApproval(address operator, uint256 tokenId);

    /**
     * @dev Indicates a failure with the `approver` of a token to be approved. Used in approvals.
     * @param approver Address initiating an approval operation.
     */
    error ERC721InvalidApprover(address approver);

    /**
     * @dev Indicates a failure with the `operator` to be approved. Used in approvals.
     * @param operator Address that may be allowed to operate on tokens without being their owner.
     */
    error ERC721InvalidOperator(address operator);
}

/**
 * @dev Standard ERC-1155 Errors
 * Interface of the https://eips.ethereum.org/EIPS/eip-6093[ERC-6093] custom errors for ERC-1155 tokens.
 */
interface IERC1155Errors {
    /**
     * @dev Indicates an error related to the current `balance` of a `sender`. Used in transfers.
     * @param sender Address whose tokens are being transferred.
     * @param balance Current balance for the interacting account.
     * @param needed Minimum amount required to perform a transfer.
     * @param tokenId Identifier number of a token.
     */
    error ERC1155InsufficientBalance(address sender, uint256 balance, uint256 needed, uint256 tokenId);

    /**
     * @dev Indicates a failure with the token `sender`. Used in transfers.
     * @param sender Address whose tokens are being transferred.
     */
    error ERC1155InvalidSender(address sender);

    /**
     * @dev Indicates a failure with the token `receiver`. Used in transfers.
     * @param receiver Address to which tokens are being transferred.
     */
    error ERC1155InvalidReceiver(address receiver);

    /**
     * @dev Indicates a failure with the `operator`’s approval. Used in transfers.
     * @param operator Address that may be allowed to operate on tokens without being their owner.
     * @param owner Address of the current owner of a token.
     */
    error ERC1155MissingApprovalForAll(address operator, address owner);

    /**
     * @dev Indicates a failure with the `approver` of a token to be approved. Used in approvals.
     * @param approver Address initiating an approval operation.
     */
    error ERC1155InvalidApprover(address approver);

    /**
     * @dev Indicates a failure with the `operator` to be approved. Used in approvals.
     * @param operator Address that may be allowed to operate on tokens without being their owner.
     */
    error ERC1155InvalidOperator(address operator);

    /**
     * @dev Indicates an array length mismatch between ids and values in a safeBatchTransferFrom operation.
     * Used in batch transfers.
     * @param idsLength Length of the array of token identifiers
     * @param valuesLength Length of the array of token amounts
     */
    error ERC1155InvalidArrayLength(uint256 idsLength, uint256 valuesLength);
}


// File: @openzeppelin\contracts\token\ERC20\ERC20.sol
// OpenZeppelin Contracts (last updated v5.5.0) (token/ERC20/ERC20.sol)



/**
 * @dev Implementation of the {IERC20} interface.
 *
 * This implementation is agnostic to the way tokens are created. This means
 * that a supply mechanism has to be added in a derived contract using {_mint}.
 *
 * TIP: For a detailed writeup see our guide
 * https://forum.openzeppelin.com/t/how-to-implement-erc20-supply-mechanisms/226[How
 * to implement supply mechanisms].
 *
 * The default value of {decimals} is 18. To change this, you should override
 * this function so it returns a different value.
 *
 * We have followed general OpenZeppelin Contracts guidelines: functions revert
 * instead returning `false` on failure. This behavior is nonetheless
 * conventional and does not conflict with the expectations of ERC-20
 * applications.
 */
abstract contract ERC20 is Context, IERC20, IERC20Metadata, IERC20Errors {
    mapping(address account => uint256) private _balances;

    mapping(address account => mapping(address spender => uint256)) private _allowances;

    uint256 private _totalSupply;

    string private _name;
    string private _symbol;

    /**
     * @dev Sets the values for {name} and {symbol}.
     *
     * Both values are immutable: they can only be set once during construction.
     */
    constructor(string memory name_, string memory symbol_) {
        _name = name_;
        _symbol = symbol_;
    }

    /**
     * @dev Returns the name of the token.
     */
    function name() public view virtual returns (string memory) {
        return _name;
    }

    /**
     * @dev Returns the symbol of the token, usually a shorter version of the
     * name.
     */
    function symbol() public view virtual returns (string memory) {
        return _symbol;
    }

    /**
     * @dev Returns the number of decimals used to get its user representation.
     * For example, if `decimals` equals `2`, a balance of `505` tokens should
     * be displayed to a user as `5.05` (`505 / 10 ** 2`).
     *
     * Tokens usually opt for a value of 18, imitating the relationship between
     * Ether and Wei. This is the default value returned by this function, unless
     * it's overridden.
     *
     * NOTE: This information is only used for _display_ purposes: it in
     * no way affects any of the arithmetic of the contract, including
     * {IERC20-balanceOf} and {IERC20-transfer}.
     */
    function decimals() public view virtual returns (uint8) {
        return 18;
    }

    /// @inheritdoc IERC20
    function totalSupply() public view virtual returns (uint256) {
        return _totalSupply;
    }

    /// @inheritdoc IERC20
    function balanceOf(address account) public view virtual returns (uint256) {
        return _balances[account];
    }

    /**
     * @dev See {IERC20-transfer}.
     *
     * Requirements:
     *
     * - `to` cannot be the zero address.
     * - the caller must have a balance of at least `value`.
     */
    function transfer(address to, uint256 value) public virtual returns (bool) {
        address owner = _msgSender();
        _transfer(owner, to, value);
        return true;
    }

    /// @inheritdoc IERC20
    function allowance(address owner, address spender) public view virtual returns (uint256) {
        return _allowances[owner][spender];
    }

    /**
     * @dev See {IERC20-approve}.
     *
     * NOTE: If `value` is the maximum `uint256`, the allowance is not updated on
     * `transferFrom`. This is semantically equivalent to an infinite approval.
     *
     * Requirements:
     *
     * - `spender` cannot be the zero address.
     */
    function approve(address spender, uint256 value) public virtual returns (bool) {
        address owner = _msgSender();
        _approve(owner, spender, value);
        return true;
    }

    /**
     * @dev See {IERC20-transferFrom}.
     *
     * Skips emitting an {Approval} event indicating an allowance update. This is not
     * required by the ERC. See {xref-ERC20-_approve-address-address-uint256-bool-}[_approve].
     *
     * NOTE: Does not update the allowance if the current allowance
     * is the maximum `uint256`.
     *
     * Requirements:
     *
     * - `from` and `to` cannot be the zero address.
     * - `from` must have a balance of at least `value`.
     * - the caller must have allowance for ``from``'s tokens of at least
     * `value`.
     */
    function transferFrom(address from, address to, uint256 value) public virtual returns (bool) {
        address spender = _msgSender();
        _spendAllowance(from, spender, value);
        _transfer(from, to, value);
        return true;
    }

    /**
     * @dev Moves a `value` amount of tokens from `from` to `to`.
     *
     * This internal function is equivalent to {transfer}, and can be used to
     * e.g. implement automatic token fees, slashing mechanisms, etc.
     *
     * Emits a {Transfer} event.
     *
     * NOTE: This function is not virtual, {_update} should be overridden instead.
     */
    function _transfer(address from, address to, uint256 value) internal {
        if (from == address(0)) {
            revert ERC20InvalidSender(address(0));
        }
        if (to == address(0)) {
            revert ERC20InvalidReceiver(address(0));
        }
        _update(from, to, value);
    }

    /**
     * @dev Transfers a `value` amount of tokens from `from` to `to`, or alternatively mints (or burns) if `from`
     * (or `to`) is the zero address. All customizations to transfers, mints, and burns should be done by overriding
     * this function.
     *
     * Emits a {Transfer} event.
     */
    function _update(address from, address to, uint256 value) internal virtual {
        if (from == address(0)) {
            // Overflow check required: The rest of the code assumes that totalSupply never overflows
            _totalSupply += value;
        } else {
            uint256 fromBalance = _balances[from];
            if (fromBalance < value) {
                revert ERC20InsufficientBalance(from, fromBalance, value);
            }
            unchecked {
                // Overflow not possible: value <= fromBalance <= totalSupply.
                _balances[from] = fromBalance - value;
            }
        }

        if (to == address(0)) {
            unchecked {
                // Overflow not possible: value <= totalSupply or value <= fromBalance <= totalSupply.
                _totalSupply -= value;
            }
        } else {
            unchecked {
                // Overflow not possible: balance + value is at most totalSupply, which we know fits into a uint256.
                _balances[to] += value;
            }
        }

        emit Transfer(from, to, value);
    }

    /**
     * @dev Creates a `value` amount of tokens and assigns them to `account`, by transferring it from address(0).
     * Relies on the `_update` mechanism
     *
     * Emits a {Transfer} event with `from` set to the zero address.
     *
     * NOTE: This function is not virtual, {_update} should be overridden instead.
     */
    function _mint(address account, uint256 value) internal {
        if (account == address(0)) {
            revert ERC20InvalidReceiver(address(0));
        }
        _update(address(0), account, value);
    }

    /**
     * @dev Destroys a `value` amount of tokens from `account`, lowering the total supply.
     * Relies on the `_update` mechanism.
     *
     * Emits a {Transfer} event with `to` set to the zero address.
     *
     * NOTE: This function is not virtual, {_update} should be overridden instead
     */
    function _burn(address account, uint256 value) internal {
        if (account == address(0)) {
            revert ERC20InvalidSender(address(0));
        }
        _update(account, address(0), value);
    }

    /**
     * @dev Sets `value` as the allowance of `spender` over the `owner`'s tokens.
     *
     * This internal function is equivalent to `approve`, and can be used to
     * e.g. set automatic allowances for certain subsystems, etc.
     *
     * Emits an {Approval} event.
     *
     * Requirements:
     *
     * - `owner` cannot be the zero address.
     * - `spender` cannot be the zero address.
     *
     * Overrides to this logic should be done to the variant with an additional `bool emitEvent` argument.
     */
    function _approve(address owner, address spender, uint256 value) internal {
        _approve(owner, spender, value, true);
    }

    /**
     * @dev Variant of {_approve} with an optional flag to enable or disable the {Approval} event.
     *
     * By default (when calling {_approve}) the flag is set to true. On the other hand, approval changes made by
     * `_spendAllowance` during the `transferFrom` operation sets the flag to false. This saves gas by not emitting any
     * `Approval` event during `transferFrom` operations.
     *
     * Anyone who wishes to continue emitting `Approval` events on the `transferFrom` operation can force the flag to
     * true using the following override:
     *
     * ```solidity
     * function _approve(address owner, address spender, uint256 value, bool) internal virtual override {
     *     super._approve(owner, spender, value, true);
     * }
     * ```
     *
     * Requirements are the same as {_approve}.
     */
    function _approve(address owner, address spender, uint256 value, bool emitEvent) internal virtual {
        if (owner == address(0)) {
            revert ERC20InvalidApprover(address(0));
        }
        if (spender == address(0)) {
            revert ERC20InvalidSpender(address(0));
        }
        _allowances[owner][spender] = value;
        if (emitEvent) {
            emit Approval(owner, spender, value);
        }
    }

    /**
     * @dev Updates `owner`'s allowance for `spender` based on spent `value`.
     *
     * Does not update the allowance value in case of infinite allowance.
     * Revert if not enough allowance is available.
     *
     * Does not emit an {Approval} event.
     */
    function _spendAllowance(address owner, address spender, uint256 value) internal virtual {
        uint256 currentAllowance = allowance(owner, spender);
        if (currentAllowance < type(uint256).max) {
            if (currentAllowance < value) {
                revert ERC20InsufficientAllowance(spender, currentAllowance, value);
            }
            unchecked {
                _approve(owner, spender, currentAllowance - value, false);
            }
        }
    }
}


// File: @openzeppelin\contracts\access\Ownable.sol
// OpenZeppelin Contracts (last updated v5.0.0) (access/Ownable.sol)



/**
 * @dev Contract module which provides a basic access control mechanism, where
 * there is an account (an owner) that can be granted exclusive access to
 * specific functions.
 *
 * The initial owner is set to the address provided by the deployer. This can
 * later be changed with {transferOwnership}.
 *
 * This module is used through inheritance. It will make available the modifier
 * `onlyOwner`, which can be applied to your functions to restrict their use to
 * the owner.
 */
abstract contract Ownable is Context {
    address private _owner;

    /**
     * @dev The caller account is not authorized to perform an operation.
     */
    error OwnableUnauthorizedAccount(address account);

    /**
     * @dev The owner is not a valid owner account. (eg. `address(0)`)
     */
    error OwnableInvalidOwner(address owner);

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Initializes the contract setting the address provided by the deployer as the initial owner.
     */
    constructor(address initialOwner) {
        if (initialOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(initialOwner);
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view virtual returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if the sender is not the owner.
     */
    function _checkOwner() internal view virtual {
        if (owner() != _msgSender()) {
            revert OwnableUnauthorizedAccount(_msgSender());
        }
    }

    /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * `onlyOwner` functions. Can only be called by the current owner.
     *
     * NOTE: Renouncing ownership will leave the contract without an owner,
     * thereby disabling any functionality that is only available to the owner.
     */
    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public virtual onlyOwner {
        if (newOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(newOwner);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Internal function without access restriction.
     */
    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}


// File: @openzeppelin\contracts\interfaces\IERC20.sol
// OpenZeppelin Contracts (last updated v5.4.0) (interfaces/IERC20.sol)




// File: @openzeppelin\contracts\utils\introspection\IERC165.sol
// OpenZeppelin Contracts (last updated v5.4.0) (utils/introspection/IERC165.sol)


/**
 * @dev Interface of the ERC-165 standard, as defined in the
 * https://eips.ethereum.org/EIPS/eip-165[ERC].
 *
 * Implementers can declare support of contract interfaces, which can then be
 * queried by others ({ERC165Checker}).
 *
 * For an implementation, see {ERC165}.
 */
interface IERC165 {
    /**
     * @dev Returns true if this contract implements the interface defined by
     * `interfaceId`. See the corresponding
     * https://eips.ethereum.org/EIPS/eip-165#how-interfaces-are-identified[ERC section]
     * to learn more about how these ids are created.
     *
     * This function call must use less than 30 000 gas.
     */
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}


// File: @openzeppelin\contracts\interfaces\IERC165.sol
// OpenZeppelin Contracts (last updated v5.4.0) (interfaces/IERC165.sol)




// File: @openzeppelin\contracts\interfaces\IERC1363.sol
// OpenZeppelin Contracts (last updated v5.4.0) (interfaces/IERC1363.sol)



/**
 * @title IERC1363
 * @dev Interface of the ERC-1363 standard as defined in the https://eips.ethereum.org/EIPS/eip-1363[ERC-1363].
 *
 * Defines an extension interface for ERC-20 tokens that supports executing code on a recipient contract
 * after `transfer` or `transferFrom`, or code on a spender contract after `approve`, in a single transaction.
 */
interface IERC1363 is IERC20, IERC165 {
    /*
     * Note: the ERC-165 identifier for this interface is 0xb0202a11.
     * 0xb0202a11 ===
     *   bytes4(keccak256('transferAndCall(address,uint256)')) ^
     *   bytes4(keccak256('transferAndCall(address,uint256,bytes)')) ^
     *   bytes4(keccak256('transferFromAndCall(address,address,uint256)')) ^
     *   bytes4(keccak256('transferFromAndCall(address,address,uint256,bytes)')) ^
     *   bytes4(keccak256('approveAndCall(address,uint256)')) ^
     *   bytes4(keccak256('approveAndCall(address,uint256,bytes)'))
     */

    /**
     * @dev Moves a `value` amount of tokens from the caller's account to `to`
     * and then calls {IERC1363Receiver-onTransferReceived} on `to`.
     * @param to The address which you want to transfer to.
     * @param value The amount of tokens to be transferred.
     * @return A boolean value indicating whether the operation succeeded unless throwing.
     */
    function transferAndCall(address to, uint256 value) external returns (bool);

    /**
     * @dev Moves a `value` amount of tokens from the caller's account to `to`
     * and then calls {IERC1363Receiver-onTransferReceived} on `to`.
     * @param to The address which you want to transfer to.
     * @param value The amount of tokens to be transferred.
     * @param data Additional data with no specified format, sent in call to `to`.
     * @return A boolean value indicating whether the operation succeeded unless throwing.
     */
    function transferAndCall(address to, uint256 value, bytes calldata data) external returns (bool);

    /**
     * @dev Moves a `value` amount of tokens from `from` to `to` using the allowance mechanism
     * and then calls {IERC1363Receiver-onTransferReceived} on `to`.
     * @param from The address which you want to send tokens from.
     * @param to The address which you want to transfer to.
     * @param value The amount of tokens to be transferred.
     * @return A boolean value indicating whether the operation succeeded unless throwing.
     */
    function transferFromAndCall(address from, address to, uint256 value) external returns (bool);

    /**
     * @dev Moves a `value` amount of tokens from `from` to `to` using the allowance mechanism
     * and then calls {IERC1363Receiver-onTransferReceived} on `to`.
     * @param from The address which you want to send tokens from.
     * @param to The address which you want to transfer to.
     * @param value The amount of tokens to be transferred.
     * @param data Additional data with no specified format, sent in call to `to`.
     * @return A boolean value indicating whether the operation succeeded unless throwing.
     */
    function transferFromAndCall(address from, address to, uint256 value, bytes calldata data) external returns (bool);

    /**
     * @dev Sets a `value` amount of tokens as the allowance of `spender` over the
     * caller's tokens and then calls {IERC1363Spender-onApprovalReceived} on `spender`.
     * @param spender The address which will spend the funds.
     * @param value The amount of tokens to be spent.
     * @return A boolean value indicating whether the operation succeeded unless throwing.
     */
    function approveAndCall(address spender, uint256 value) external returns (bool);

    /**
     * @dev Sets a `value` amount of tokens as the allowance of `spender` over the
     * caller's tokens and then calls {IERC1363Spender-onApprovalReceived} on `spender`.
     * @param spender The address which will spend the funds.
     * @param value The amount of tokens to be spent.
     * @param data Additional data with no specified format, sent in call to `spender`.
     * @return A boolean value indicating whether the operation succeeded unless throwing.
     */
    function approveAndCall(address spender, uint256 value, bytes calldata data) external returns (bool);
}


// File: @openzeppelin\contracts\token\ERC20\utils\SafeERC20.sol
// OpenZeppelin Contracts (last updated v5.5.0) (token/ERC20/utils/SafeERC20.sol)



/**
 * @title SafeERC20
 * @dev Wrappers around ERC-20 operations that throw on failure (when the token
 * contract returns false). Tokens that return no value (and instead revert or
 * throw on failure) are also supported, non-reverting calls are assumed to be
 * successful.
 * To use this library you can add a `using SafeERC20 for IERC20;` statement to your contract,
 * which allows you to call the safe operations as `token.safeTransfer(...)`, etc.
 */
library SafeERC20 {
    /**
     * @dev An operation with an ERC-20 token failed.
     */
    error SafeERC20FailedOperation(address token);

    /**
     * @dev Indicates a failed `decreaseAllowance` request.
     */
    error SafeERC20FailedDecreaseAllowance(address spender, uint256 currentAllowance, uint256 requestedDecrease);

    /**
     * @dev Transfer `value` amount of `token` from the calling contract to `to`. If `token` returns no value,
     * non-reverting calls are assumed to be successful.
     */
    function safeTransfer(IERC20 token, address to, uint256 value) internal {
        if (!_safeTransfer(token, to, value, true)) {
            revert SafeERC20FailedOperation(address(token));
        }
    }

    /**
     * @dev Transfer `value` amount of `token` from `from` to `to`, spending the approval given by `from` to the
     * calling contract. If `token` returns no value, non-reverting calls are assumed to be successful.
     */
    function safeTransferFrom(IERC20 token, address from, address to, uint256 value) internal {
        if (!_safeTransferFrom(token, from, to, value, true)) {
            revert SafeERC20FailedOperation(address(token));
        }
    }

    /**
     * @dev Variant of {safeTransfer} that returns a bool instead of reverting if the operation is not successful.
     */
    function trySafeTransfer(IERC20 token, address to, uint256 value) internal returns (bool) {
        return _safeTransfer(token, to, value, false);
    }

    /**
     * @dev Variant of {safeTransferFrom} that returns a bool instead of reverting if the operation is not successful.
     */
    function trySafeTransferFrom(IERC20 token, address from, address to, uint256 value) internal returns (bool) {
        return _safeTransferFrom(token, from, to, value, false);
    }

    /**
     * @dev Increase the calling contract's allowance toward `spender` by `value`. If `token` returns no value,
     * non-reverting calls are assumed to be successful.
     *
     * IMPORTANT: If the token implements ERC-7674 (ERC-20 with temporary allowance), and if the "client"
     * smart contract uses ERC-7674 to set temporary allowances, then the "client" smart contract should avoid using
     * this function. Performing a {safeIncreaseAllowance} or {safeDecreaseAllowance} operation on a token contract
     * that has a non-zero temporary allowance (for that particular owner-spender) will result in unexpected behavior.
     */
    function safeIncreaseAllowance(IERC20 token, address spender, uint256 value) internal {
        uint256 oldAllowance = token.allowance(address(this), spender);
        forceApprove(token, spender, oldAllowance + value);
    }

    /**
     * @dev Decrease the calling contract's allowance toward `spender` by `requestedDecrease`. If `token` returns no
     * value, non-reverting calls are assumed to be successful.
     *
     * IMPORTANT: If the token implements ERC-7674 (ERC-20 with temporary allowance), and if the "client"
     * smart contract uses ERC-7674 to set temporary allowances, then the "client" smart contract should avoid using
     * this function. Performing a {safeIncreaseAllowance} or {safeDecreaseAllowance} operation on a token contract
     * that has a non-zero temporary allowance (for that particular owner-spender) will result in unexpected behavior.
     */
    function safeDecreaseAllowance(IERC20 token, address spender, uint256 requestedDecrease) internal {
        unchecked {
            uint256 currentAllowance = token.allowance(address(this), spender);
            if (currentAllowance < requestedDecrease) {
                revert SafeERC20FailedDecreaseAllowance(spender, currentAllowance, requestedDecrease);
            }
            forceApprove(token, spender, currentAllowance - requestedDecrease);
        }
    }

    /**
     * @dev Set the calling contract's allowance toward `spender` to `value`. If `token` returns no value,
     * non-reverting calls are assumed to be successful. Meant to be used with tokens that require the approval
     * to be set to zero before setting it to a non-zero value, such as USDT.
     *
     * NOTE: If the token implements ERC-7674, this function will not modify any temporary allowance. This function
     * only sets the "standard" allowance. Any temporary allowance will remain active, in addition to the value being
     * set here.
     */
    function forceApprove(IERC20 token, address spender, uint256 value) internal {
        if (!_safeApprove(token, spender, value, false)) {
            if (!_safeApprove(token, spender, 0, true)) revert SafeERC20FailedOperation(address(token));
            if (!_safeApprove(token, spender, value, true)) revert SafeERC20FailedOperation(address(token));
        }
    }

    /**
     * @dev Performs an {ERC1363} transferAndCall, with a fallback to the simple {ERC20} transfer if the target has no
     * code. This can be used to implement an {ERC721}-like safe transfer that relies on {ERC1363} checks when
     * targeting contracts.
     *
     * Reverts if the returned value is other than `true`.
     */
    function transferAndCallRelaxed(IERC1363 token, address to, uint256 value, bytes memory data) internal {
        if (to.code.length == 0) {
            safeTransfer(token, to, value);
        } else if (!token.transferAndCall(to, value, data)) {
            revert SafeERC20FailedOperation(address(token));
        }
    }

    /**
     * @dev Performs an {ERC1363} transferFromAndCall, with a fallback to the simple {ERC20} transferFrom if the target
     * has no code. This can be used to implement an {ERC721}-like safe transfer that relies on {ERC1363} checks when
     * targeting contracts.
     *
     * Reverts if the returned value is other than `true`.
     */
    function transferFromAndCallRelaxed(
        IERC1363 token,
        address from,
        address to,
        uint256 value,
        bytes memory data
    ) internal {
        if (to.code.length == 0) {
            safeTransferFrom(token, from, to, value);
        } else if (!token.transferFromAndCall(from, to, value, data)) {
            revert SafeERC20FailedOperation(address(token));
        }
    }

    /**
     * @dev Performs an {ERC1363} approveAndCall, with a fallback to the simple {ERC20} approve if the target has no
     * code. This can be used to implement an {ERC721}-like safe transfer that rely on {ERC1363} checks when
     * targeting contracts.
     *
     * NOTE: When the recipient address (`to`) has no code (i.e. is an EOA), this function behaves as {forceApprove}.
     * Oppositely, when the recipient address (`to`) has code, this function only attempts to call {ERC1363-approveAndCall}
     * once without retrying, and relies on the returned value to be true.
     *
     * Reverts if the returned value is other than `true`.
     */
    function approveAndCallRelaxed(IERC1363 token, address to, uint256 value, bytes memory data) internal {
        if (to.code.length == 0) {
            forceApprove(token, to, value);
        } else if (!token.approveAndCall(to, value, data)) {
            revert SafeERC20FailedOperation(address(token));
        }
    }

    /**
     * @dev Imitates a Solidity `token.transfer(to, value)` call, relaxing the requirement on the return value: the
     * return value is optional (but if data is returned, it must not be false).
     *
     * @param token The token targeted by the call.
     * @param to The recipient of the tokens
     * @param value The amount of token to transfer
     * @param bubble Behavior switch if the transfer call reverts: bubble the revert reason or return a false boolean.
     */
    function _safeTransfer(IERC20 token, address to, uint256 value, bool bubble) private returns (bool success) {
        bytes4 selector = IERC20.transfer.selector;

        assembly ("memory-safe") {
            let fmp := mload(0x40)
            mstore(0x00, selector)
            mstore(0x04, and(to, shr(96, not(0))))
            mstore(0x24, value)
            success := call(gas(), token, 0, 0x00, 0x44, 0x00, 0x20)
            // if call success and return is true, all is good.
            // otherwise (not success or return is not true), we need to perform further checks
            if iszero(and(success, eq(mload(0x00), 1))) {
                // if the call was a failure and bubble is enabled, bubble the error
                if and(iszero(success), bubble) {
                    returndatacopy(fmp, 0x00, returndatasize())
                    revert(fmp, returndatasize())
                }
                // if the return value is not true, then the call is only successful if:
                // - the token address has code
                // - the returndata is empty
                success := and(success, and(iszero(returndatasize()), gt(extcodesize(token), 0)))
            }
            mstore(0x40, fmp)
        }
    }

    /**
     * @dev Imitates a Solidity `token.transferFrom(from, to, value)` call, relaxing the requirement on the return
     * value: the return value is optional (but if data is returned, it must not be false).
     *
     * @param token The token targeted by the call.
     * @param from The sender of the tokens
     * @param to The recipient of the tokens
     * @param value The amount of token to transfer
     * @param bubble Behavior switch if the transfer call reverts: bubble the revert reason or return a false boolean.
     */
    function _safeTransferFrom(
        IERC20 token,
        address from,
        address to,
        uint256 value,
        bool bubble
    ) private returns (bool success) {
        bytes4 selector = IERC20.transferFrom.selector;

        assembly ("memory-safe") {
            let fmp := mload(0x40)
            mstore(0x00, selector)
            mstore(0x04, and(from, shr(96, not(0))))
            mstore(0x24, and(to, shr(96, not(0))))
            mstore(0x44, value)
            success := call(gas(), token, 0, 0x00, 0x64, 0x00, 0x20)
            // if call success and return is true, all is good.
            // otherwise (not success or return is not true), we need to perform further checks
            if iszero(and(success, eq(mload(0x00), 1))) {
                // if the call was a failure and bubble is enabled, bubble the error
                if and(iszero(success), bubble) {
                    returndatacopy(fmp, 0x00, returndatasize())
                    revert(fmp, returndatasize())
                }
                // if the return value is not true, then the call is only successful if:
                // - the token address has code
                // - the returndata is empty
                success := and(success, and(iszero(returndatasize()), gt(extcodesize(token), 0)))
            }
            mstore(0x40, fmp)
            mstore(0x60, 0)
        }
    }

    /**
     * @dev Imitates a Solidity `token.approve(spender, value)` call, relaxing the requirement on the return value:
     * the return value is optional (but if data is returned, it must not be false).
     *
     * @param token The token targeted by the call.
     * @param spender The spender of the tokens
     * @param value The amount of token to transfer
     * @param bubble Behavior switch if the transfer call reverts: bubble the revert reason or return a false boolean.
     */
    function _safeApprove(IERC20 token, address spender, uint256 value, bool bubble) private returns (bool success) {
        bytes4 selector = IERC20.approve.selector;

        assembly ("memory-safe") {
            let fmp := mload(0x40)
            mstore(0x00, selector)
            mstore(0x04, and(spender, shr(96, not(0))))
            mstore(0x24, value)
            success := call(gas(), token, 0, 0x00, 0x44, 0x00, 0x20)
            // if call success and return is true, all is good.
            // otherwise (not success or return is not true), we need to perform further checks
            if iszero(and(success, eq(mload(0x00), 1))) {
                // if the call was a failure and bubble is enabled, bubble the error
                if and(iszero(success), bubble) {
                    returndatacopy(fmp, 0x00, returndatasize())
                    revert(fmp, returndatasize())
                }
                // if the return value is not true, then the call is only successful if:
                // - the token address has code
                // - the returndata is empty
                success := and(success, and(iszero(returndatasize()), gt(extcodesize(token), 0)))
            }
            mstore(0x40, fmp)
        }
    }
}


// File: ..\src\Reconstructed_KoperasiSimpanPinjam.sol


contract SaldoIDR is ERC20, Ownable {
    constructor() ERC20("Koperasi Rupiah", "IDR") Ownable(msg.sender) {}

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) public onlyOwner {
        _burn(from, amount);
    }

    function transfer(address, uint256) public pure override returns (bool) {
        revert("Closed Loop: Transfer antar user tidak diizinkan. Gunakan Withdrawal.");
    }

    function transferFrom(address, address, uint256) public pure override returns (bool) {
        revert("Closed Loop: Transfer antar user tidak diizinkan.");
    }
}

contract KoperasiSimpanPinjam is ReentrancyGuard, Ownable {
    using SafeERC20 for SaldoIDR;

    SaldoIDR public saldoIDR;
    mapping(address => bool) public isPengurus;

    enum StatusPinjaman { Pending, Surveyed, CommitteeApproved, Aktif, Lunas, Ditolak, Macet }
    enum MemberStatus { None, Active, Inactive, Suspended, Quit } 
    enum Kolektibilitas { Lancar, DPK, KurangLancar, Diragukan, Macet }

    struct Anggota {
        bool terdaftar;
        MemberStatus status;
        string nama;
        string profileHash;
        uint256 simpananPokok;
        uint256 simpananWajib;
        uint256 simpananSukarela;
        uint256 shuSudahDiambil;
        uint256 branchID;
        uint256 limitPinjaman;
        string noHP;
        string noKTP;
        string alamat;
        string gender;
        string job;
        string emergency;
    }

    struct Pinjaman {
        uint256 id;
        address peminjam;
        uint256 jumlahPinjaman;
        uint256 totalHarusDibayar;
        uint256 sudahDibayar;
        uint256 tenorBulan;
        uint256 waktuJatuhTempo;
        StatusPinjaman status;
        Kolektibilitas quality;
        bool isRestructured;
        string surveyNote;
        address approvedByCommittee;
    }

    struct SimpananBerjangka {
        uint256 amount;
        uint256 lockUntil;
        uint256 interestRate;
        bool active;
    }

    struct GlobalConfig {
        bool autoCollectibility;
        bool multiBranchEnabled;
        bool deductFeesUpfront;
        bool isPeriodClosed;
        uint256 nominalSimpananPokok;
        uint256 nominalAdmPendaftaran;
        uint256 minSaldo;
        uint256 feeAdministrasi;
        uint256 feeProvisiPersen;
        uint256 feeResikoPersen;
        uint256 currentLiquidityPool;
    }

    struct RegisterParams {
        address user;
        string nama;
        string profileHash; 
        uint256 branchId;
        string noHP;
        string noKTP;
        string alamat;
        string gender;
        string job;
        string emergency;
    }

    struct SettingsParams {
        bool autoColl;
        bool multiBranch;
        bool deductUpfront;
        bool closePeriod;
        uint256 pokok;
        uint256 adm;
        uint256 minSaldo;
        uint256 feeAdmin;
        uint256 feeProvisi;
        uint256 feeResiko;
    }

    GlobalConfig public settings;
    mapping(address => SimpananBerjangka[]) public userTimeDeposits;

    mapping(address => Anggota) public dataAnggota;
    mapping(uint256 => Pinjaman) public dataPinjaman;
    mapping(address => uint256) public idPinjamanAktifAnggota;
    mapping(address => uint256) public loanBalance;
    mapping(address => uint256) public tagihanWajib;

    address[] public listAlamatAnggota;
    uint256 public idPinjamanTerakhir;
    uint256 public jumlahAnggota;
    
    uint256 public bungaSimpananTahunanPersen = 5;
    uint256 public bungaPinjamanTahunanPersen = 12;
    uint256 public dendaHarianPermil = 1;

    uint256 public totalSimpananSeluruhAnggota;
    uint256 public profitBelumDibagi;
    uint256 public totalSHUDibagikan;

    bool public useIPFSStorage = false;
    event StorageModeUpdated(address indexed admin, bool useIPFS, uint256 timestamp);

    event AnggotaBaru(address indexed user, string nama, uint256 timestamp);
    event AnggotaRejoin(address indexed user, uint256 timestamp); 
    event DepositTercatat(address indexed user, uint256 jumlah, string jenis, uint256 timestamp);
    event PenarikanTercatat(address indexed user, uint256 jumlah, uint256 timestamp);
    event PinjamanDiajukan(uint256 id, address indexed peminjam, uint256 jumlah, uint256 tenor);
    event PinjamanDisetujui(uint256 id, address indexed peminjam, uint256 jatubTempo);
    event PinjamanDitolak(uint256 id, address indexed peminjam, string alasan);
    event PinjamanLunas(uint256 indexed loanId, address indexed peminjam, uint256 timestamp);
    event SettingsUpdated(address indexed admin, uint256 timestamp);
    event LiquiditySynced(uint256 newPool, uint256 timestamp);
    event SurveyApproved(uint256 indexed loanId, string note);
    event CommitteeApproved(uint256 indexed loanId, address committee);
    event MembershipClosed(address indexed member, uint256 refundAmount);
    event CollectibilityUpdated(uint256 indexed loanId, Kolektibilitas status);
    event RestrukturTercatat(uint256 indexed loanId, uint256 newTotal, uint256 newTenor);
    event MemberProfileUpdated(address indexed member, string field, uint256 timestamp);
    event TagihanDibuat(uint256 nominalTotal, uint256 timestamp);
    event BagiHasilDirilis(uint256 nominalTotal, uint256 timestamp);
    event BagiHasilBatchDirilis(uint256 nominalTotal, uint256 anggotaTerproses, uint256 timestamp);
    event SHUDiterima(address indexed user, uint256 jumlah, uint256 timestamp); 
    event DendaDiterapkan(uint256 indexed loanId, uint256 denda);
    event AngsuranMasuk(uint256 indexed loanId, address indexed peminjam, uint256 jumlah);
    event SimpananBerjangkaDibuka(address indexed user, uint256 amount, uint256 tenorBulan, uint256 timestamp); 
    event SimpananBerjangkaDicairkan(address indexed user, uint256 amount, uint256 bunga, uint256 timestamp);
    event ConfigUpdated(string key, uint256 value);
    event PengurusDitambahkan(address indexed admin, uint256 timestamp); 

    modifier hanyaPengurus() {
        require(isPengurus[msg.sender] || msg.sender == owner(), "Hanya Admin/Pengurus");
        _;
    }

    modifier hanyaAnggota() {
        require(dataAnggota[msg.sender].terdaftar, "Belum terdaftar anggota");
        _;
    }

    modifier openPeriod() {
        require(!settings.isPeriodClosed, "Periode transaksi sudah ditutup");
        _;
    }

    constructor() Ownable(msg.sender) {
        isPengurus[msg.sender] = true;
        saldoIDR = new SaldoIDR();
    }

    function setBungaSimpanan(uint256 _persenTahunan) external hanyaPengurus {
        require(_persenTahunan <= 9, "Regulasi: Max 9% per tahun");
        bungaSimpananTahunanPersen = _persenTahunan;
        emit ConfigUpdated("BungaSimpanan", _persenTahunan);
    }

    function setBungaPinjaman(uint256 _persenTahunan) external hanyaPengurus {
        require(_persenTahunan <= 24, "Regulasi: Max 24% per tahun");
        bungaPinjamanTahunanPersen = _persenTahunan;
        emit ConfigUpdated("BungaPinjaman", _persenTahunan);
    }

    function setDendaHarian(uint256 _permil) external hanyaPengurus {
        require(_permil <= 10, "Max 1% per hari");
        dendaHarianPermil = _permil;
        emit ConfigUpdated("DendaHarian", _permil);
    }

    function tambahPengurus(address _admin) external onlyOwner {
        isPengurus[_admin] = true;
        emit PengurusDitambahkan(_admin, block.timestamp); 
    }

    function setStorageMode(bool _useIPFS) external hanyaPengurus {
        useIPFSStorage = _useIPFS;
        emit StorageModeUpdated(msg.sender, _useIPFS, block.timestamp);
    }

    function updateGlobalSettings(SettingsParams calldata p) external hanyaPengurus {
        settings.autoCollectibility = p.autoColl;
        settings.multiBranchEnabled = p.multiBranch;
        settings.deductFeesUpfront = p.deductUpfront;
        settings.isPeriodClosed = p.closePeriod;
        settings.nominalSimpananPokok = p.pokok;
        settings.nominalAdmPendaftaran = p.adm;
        settings.minSaldo = p.minSaldo;
        settings.feeAdministrasi = p.feeAdmin;
        settings.feeProvisiPersen = p.feeProvisi;
        settings.feeResikoPersen = p.feeResiko;
        emit SettingsUpdated(msg.sender, block.timestamp);
    }

    function updateLiquidityPool(uint256 _newBalance) external hanyaPengurus {
        settings.currentLiquidityPool = _newBalance;
        emit LiquiditySynced(_newBalance, block.timestamp);
    }

    function registerMember(RegisterParams calldata p) external hanyaPengurus nonReentrant {
        Anggota storage m = dataAnggota[p.user];
        require(!m.terdaftar || m.status == MemberStatus.Quit, "User sudah terdaftar dan aktif");

        bool isRejoining = m.terdaftar && m.status == MemberStatus.Quit;

        m.terdaftar = true;
        m.status = MemberStatus.Active;
        
        if (useIPFSStorage) {
            require(bytes(p.profileHash).length > 0, "IPFS Hash wajib diisi pada mode IPFS");
            m.nama = "";
            m.profileHash = p.profileHash;
            m.noHP = "";
            m.noKTP = "";
            m.alamat = "";
            m.gender = "";
            m.job = "";
            m.emergency = "";
        } else {
            require(bytes(p.nama).length > 0, "Nama wajib diisi pada mode On-Chain");
            m.nama = p.nama;
            m.profileHash = p.profileHash;
            m.noHP = p.noHP;
            m.noKTP = p.noKTP;
            m.alamat = p.alamat;
            m.gender = p.gender;
            m.job = p.job;
            m.emergency = p.emergency;
        }
        
        m.branchID = settings.multiBranchEnabled ? p.branchId : 0;
        m.simpananPokok = 0; 

        if (!isRejoining) {
            listAlamatAnggota.push(p.user);
            jumlahAnggota++;
            emit AnggotaBaru(p.user, useIPFSStorage ? "IPFS_USER" : p.nama, block.timestamp);
        } else {
            emit AnggotaRejoin(p.user, block.timestamp); 
        }
    }

    function updateMemberProfile(
        address _user, string memory _nama, string memory _profileHash
    ) external hanyaPengurus {
        require(dataAnggota[_user].terdaftar, "Anggota tidak terdaftar");
        
        if (useIPFSStorage) {
            require(bytes(_profileHash).length > 0, "IPFS Hash wajib diisi pada mode IPFS");
            dataAnggota[_user].nama = "";
            dataAnggota[_user].profileHash = _profileHash;
        } else {
            require(bytes(_nama).length > 0, "Nama wajib diisi pada mode On-Chain");
            dataAnggota[_user].nama = _nama;
            dataAnggota[_user].profileHash = _profileHash;
        }
        
        emit MemberProfileUpdated(_user, "FullProfile", block.timestamp);
    }

    function recordDeposit(address _user, uint256 _amount, bool _isWajib) external hanyaPengurus openPeriod nonReentrant {
        require(dataAnggota[_user].terdaftar, "User tidak dikenal");
        saldoIDR.mint(_user, _amount);
        
        uint256 alokasi = _amount;
        uint256 targetPokok = settings.nominalSimpananPokok;
        uint256 currentPokok = dataAnggota[_user].simpananPokok;

        if (currentPokok < targetPokok) {
            uint256 shortfall = targetPokok - currentPokok;
            uint256 toPokok = (alokasi >= shortfall) ? shortfall : alokasi;
            
            dataAnggota[_user].simpananPokok += toPokok;
            alokasi -= toPokok;
            
            emit DepositTercatat(_user, toPokok, "Simpanan Pokok", block.timestamp);
        }

        if (alokasi > 0) {
            if (_isWajib) {
                dataAnggota[_user].simpananWajib += alokasi;
                if (tagihanWajib[_user] >= alokasi) tagihanWajib[_user] -= alokasi;
                else tagihanWajib[_user] = 0;
                
                emit DepositTercatat(_user, alokasi, "Simpanan Wajib", block.timestamp);
            } else {
                dataAnggota[_user].simpananSukarela += alokasi;
                emit DepositTercatat(_user, alokasi, "Simpanan Sukarela", block.timestamp);
            }
        }

        totalSimpananSeluruhAnggota += _amount;
        settings.currentLiquidityPool += _amount;
    }

    function memberWithdraw(uint256 _amount) external hanyaAnggota openPeriod nonReentrant {
        require(idPinjamanAktifAnggota[msg.sender] == 0, "Selesaikan pinjaman aktif/pending");
        
        uint256 currentBal = dataAnggota[msg.sender].simpananSukarela;
        require(currentBal >= _amount, "Saldo sukarela kurang");
        require(currentBal - _amount >= settings.minSaldo, "Melampaui batas minimal saldo");
        require(settings.currentLiquidityPool >= _amount, "Likuiditas koperasi tidak cukup");
        
        saldoIDR.burn(msg.sender, _amount);
        dataAnggota[msg.sender].simpananSukarela -= _amount;
        totalSimpananSeluruhAnggota -= _amount;
        settings.currentLiquidityPool -= _amount;

        emit PenarikanTercatat(msg.sender, _amount, block.timestamp);
    }

    function recordWithdrawal(address _user, uint256 _amount) external hanyaPengurus openPeriod nonReentrant {
        require(idPinjamanAktifAnggota[_user] == 0, "Ada pinjaman aktif/pending");

        uint256 currentBal = dataAnggota[_user].simpananSukarela;
        require(currentBal >= _amount, "Saldo sukarela kurang");
        require(currentBal - _amount >= settings.minSaldo, "Melampaui batas minimal saldo");
        require(settings.currentLiquidityPool >= _amount, "Likuiditas koperasi tidak cukup");
        
        saldoIDR.burn(_user, _amount);
        dataAnggota[_user].simpananSukarela -= _amount;
        totalSimpananSeluruhAnggota -= _amount;
        settings.currentLiquidityPool -= _amount;

        emit PenarikanTercatat(_user, _amount, block.timestamp);
    }

    function generateMonthlyBills(uint256 _nominal) external hanyaPengurus {
        for (uint i = 0; i < listAlamatAnggota.length; i++) {
            address member = listAlamatAnggota[i];
            if (dataAnggota[member].status == MemberStatus.Active) {
                tagihanWajib[member] += _nominal;
            }
        }
        emit TagihanDibuat(_nominal * jumlahAnggota, block.timestamp);
    }

    function bayarTagihanWajib(uint256 _amount) external hanyaAnggota openPeriod nonReentrant {
        require(tagihanWajib[msg.sender] >= _amount, "Melebihi tagihan");
        require(dataAnggota[msg.sender].simpananSukarela >= _amount, "Saldo sukarela kurang");
        
        dataAnggota[msg.sender].simpananSukarela -= _amount;
        tagihanWajib[msg.sender] -= _amount;
        dataAnggota[msg.sender].simpananWajib += _amount;
        
        emit DepositTercatat(msg.sender, _amount, "Wajib", block.timestamp);
    }

    function rilisBagiHasil(uint256 _percentage) external hanyaPengurus nonReentrant {
        require(_percentage <= 100, "Max 100%");
        uint256 amountToDistribute = (profitBelumDibagi * _percentage) / 100;
        require(amountToDistribute > 0 && totalSimpananSeluruhAnggota > 0, "No profit/members");

        for (uint i = 0; i < listAlamatAnggota.length; i++) {
            address member = listAlamatAnggota[i];
            if (dataAnggota[member].status == MemberStatus.Active) {
                uint256 bal = saldoIDR.balanceOf(member);
                if (bal > 0) {
                    uint256 memberShare = (amountToDistribute * bal) / totalSimpananSeluruhAnggota;
                    if (memberShare > 0) {
                        saldoIDR.mint(member, memberShare);
                        dataAnggota[member].simpananSukarela += memberShare;
                        
                        emit SHUDiterima(member, memberShare, block.timestamp); 
                    }
                }
            }
        }
        profitBelumDibagi -= amountToDistribute;
        totalSHUDibagikan += amountToDistribute;
        emit BagiHasilDirilis(amountToDistribute, block.timestamp);
    }

    function rilisBagiHasilBatch(
        uint256 _totalAmountToDistribute, 
        uint256 _totalSimpananSnapshot, 
        uint256 _startIndex, 
        uint256 _count
    ) external hanyaPengurus nonReentrant {
        require(_totalAmountToDistribute > 0 && _totalSimpananSnapshot > 0, "Invalid params");

        uint256 limit = _startIndex + _count;
        if (limit > listAlamatAnggota.length) limit = listAlamatAnggota.length;

        uint256 distributedInThisBatch = 0; 

        for (uint i = _startIndex; i < limit; i++) {
            address member = listAlamatAnggota[i];
            if (dataAnggota[member].status == MemberStatus.Active) {
                uint256 bal = saldoIDR.balanceOf(member);
                if (bal > 0) {
                    uint256 memberShare = (_totalAmountToDistribute * bal) / _totalSimpananSnapshot;
                    if (memberShare > 0) {
                        saldoIDR.mint(member, memberShare);
                        dataAnggota[member].simpananSukarela += memberShare;
                        distributedInThisBatch += memberShare; 
                        
                        emit SHUDiterima(member, memberShare, block.timestamp); 
                    }
                }
            }
        }
        
        if (distributedInThisBatch > 0) {
            profitBelumDibagi -= distributedInThisBatch;
            totalSHUDibagikan += distributedInThisBatch;
        }

        emit BagiHasilBatchDirilis(distributedInThisBatch, limit - _startIndex, block.timestamp);
    }

    function ajukanPinjaman(uint256 _amount, uint256 _tenorBulan) external hanyaAnggota openPeriod nonReentrant {
        require(idPinjamanAktifAnggota[msg.sender] == 0, "Ada pinjaman aktif");
        
        uint256 totalBerjangka = 0;
        for (uint i = 0; i < userTimeDeposits[msg.sender].length; i++) {
            if (userTimeDeposits[msg.sender][i].active) {
                totalBerjangka += userTimeDeposits[msg.sender][i].amount;
            }
        }

        uint256 collateralAman = dataAnggota[msg.sender].simpananPokok + 
                                 dataAnggota[msg.sender].simpananWajib + 
                                 dataAnggota[msg.sender].simpananSukarela + 
                                 totalBerjangka;
                                 
        require(_amount <= collateralAman * 3, "Over limit jaminan total ekuitas");

        idPinjamanTerakhir++;
        uint256 bungaTotal = (_amount * bungaPinjamanTahunanPersen * _tenorBulan) / 1200;

        Pinjaman storage p = dataPinjaman[idPinjamanTerakhir];
        p.id = idPinjamanTerakhir;
        p.peminjam = msg.sender;
        p.jumlahPinjaman = _amount;
        p.totalHarusDibayar = _amount + bungaTotal;
        p.sudahDibayar = 0;
        p.tenorBulan = _tenorBulan;
        p.waktuJatuhTempo = 0;
        p.status = StatusPinjaman.Pending;
        p.quality = Kolektibilitas.Lancar;
        p.isRestructured = false;

        idPinjamanAktifAnggota[msg.sender] = idPinjamanTerakhir;
        emit PinjamanDiajukan(idPinjamanTerakhir, msg.sender, _amount, _tenorBulan);
    }

    function approveSurvey(uint256 _loanId, string memory _note) external hanyaPengurus {
        Pinjaman storage p = dataPinjaman[_loanId];
        require(p.status == StatusPinjaman.Pending, "Status must be Pending");
        p.status = StatusPinjaman.Surveyed;
        p.surveyNote = _note;
        emit SurveyApproved(_loanId, _note);
    }

    function approveCommittee(uint256 _loanId) external hanyaPengurus {
        Pinjaman storage p = dataPinjaman[_loanId];
        require(p.status == StatusPinjaman.Surveyed, "Status must be Surveyed");
        p.status = StatusPinjaman.CommitteeApproved;
        p.approvedByCommittee = msg.sender;
        emit CommitteeApproved(_loanId, msg.sender);
    }

    function setujuiPinjaman(uint256 _loanId) external hanyaPengurus openPeriod nonReentrant {
        Pinjaman storage p = dataPinjaman[_loanId];
        require(p.status == StatusPinjaman.CommitteeApproved, "Harus melalui tahap Komite");

        uint256 feeProvisi = (p.jumlahPinjaman * settings.feeProvisiPersen) / 100;
        uint256 feeResiko = (p.jumlahPinjaman * settings.feeResikoPersen) / 100;
        uint256 totalBiayaLainnya = settings.feeAdministrasi + feeProvisi + feeResiko;

        uint256 amountToDisburse = p.jumlahPinjaman;

        if (settings.deductFeesUpfront) {
            require(p.jumlahPinjaman > totalBiayaLainnya, "Biaya melebihi pinjaman");
            amountToDisburse = p.jumlahPinjaman - totalBiayaLainnya;
            profitBelumDibagi += totalBiayaLainnya; 
        } else {
            p.totalHarusDibayar += totalBiayaLainnya;
        }
        
        require(settings.currentLiquidityPool >= amountToDisburse, "Likuiditas Koperasi tidak cukup");
        settings.currentLiquidityPool -= amountToDisburse;

        p.status = StatusPinjaman.Aktif;
        p.waktuJatuhTempo = block.timestamp + (p.tenorBulan * 30 days);
        loanBalance[p.peminjam] += p.totalHarusDibayar;

        emit PinjamanDisetujui(_loanId, p.peminjam, p.waktuJatuhTempo);
    }

    function recordAngsuran(uint256 _loanId, uint256 _amount) external hanyaPengurus openPeriod nonReentrant {
        settings.currentLiquidityPool += _amount;
        _prosesPelunasan(_loanId, _amount);
    }

    function bayarAngsuranInternal(uint256 _loanId, uint256 _amount) external hanyaAnggota openPeriod nonReentrant {
        require(dataAnggota[msg.sender].simpananSukarela >= _amount, "Saldo sukarela kurang");
        
        dataAnggota[msg.sender].simpananSukarela -= _amount;
        saldoIDR.burn(msg.sender, _amount); 
        totalSimpananSeluruhAnggota -= _amount;
        
        _prosesPelunasan(_loanId, _amount);
    }

    function _prosesPelunasan(uint256 _loanId, uint256 _amount) internal {
        Pinjaman storage p = dataPinjaman[_loanId];
        require(p.status == StatusPinjaman.Aktif, "Pinjaman tidak aktif");

        uint256 amountToPrincipal = _amount;

        if (block.timestamp > p.waktuJatuhTempo) {
            uint256 overdueDays = (block.timestamp - p.waktuJatuhTempo) / 1 days;
            if (overdueDays > 0) {
                uint256 denda = (p.totalHarusDibayar * dendaHarianPermil * overdueDays) / 1000;
                if (_amount > denda) {
                    profitBelumDibagi += denda;
                    amountToPrincipal = _amount - denda;
                } else {
                    profitBelumDibagi += _amount;
                    amountToPrincipal = 0;
                }
                emit DendaDiterapkan(_loanId, denda);
            }
        }

        p.sudahDibayar += amountToPrincipal;
        if(loanBalance[p.peminjam] >= amountToPrincipal) loanBalance[p.peminjam] -= amountToPrincipal; 
        else loanBalance[p.peminjam] = 0;

        if (p.sudahDibayar >= p.totalHarusDibayar) {
            p.status = StatusPinjaman.Lunas;
            idPinjamanAktifAnggota[p.peminjam] = 0;
            if (p.totalHarusDibayar > p.jumlahPinjaman) {
                profitBelumDibagi += (p.totalHarusDibayar - p.jumlahPinjaman); 
            }
            emit PinjamanLunas(_loanId, p.peminjam, block.timestamp);
        }

        emit AngsuranMasuk(_loanId, p.peminjam, _amount);
    }

    function tolakPinjaman(uint256 _loanId, string memory _alasan) external hanyaPengurus {
        Pinjaman storage p = dataPinjaman[_loanId];
        // Menerima penolakan di fase Pending, Surveyed, maupun CommitteeApproved
        require(
            p.status == StatusPinjaman.Pending || 
            p.status == StatusPinjaman.Surveyed || 
            p.status == StatusPinjaman.CommitteeApproved, 
            "Status invalid"
        );
        p.status = StatusPinjaman.Ditolak;
        idPinjamanAktifAnggota[p.peminjam] = 0; 
        emit PinjamanDitolak(_loanId, p.peminjam, _alasan);
    }


    function updateCollectibilityStatus(uint256 _loanId, Kolektibilitas _status) external hanyaPengurus {
        dataPinjaman[_loanId].quality = _status;
        emit CollectibilityUpdated(_loanId, _status);
    }

    function restrukturPinjaman(uint256 _loanId, uint256 _newTenor, uint256 _newTotal) external hanyaPengurus {
        Pinjaman storage p = dataPinjaman[_loanId];
        require(p.status == StatusPinjaman.Aktif, "Hanya untuk pinjaman aktif");
        p.tenorBulan = _newTenor;
        p.totalHarusDibayar = _newTotal;
        p.waktuJatuhTempo = block.timestamp + (_newTenor * 30 days);
        p.isRestructured = true;
        emit RestrukturTercatat(_loanId, _newTotal, _newTenor);
    }

    function openSimpananBerjangka(uint256 _amount, uint256 _tenorBulan) external hanyaAnggota openPeriod nonReentrant {
        require(dataAnggota[msg.sender].simpananSukarela >= _amount, "Saldo sukarela kurang");
        
        uint256 estimasiBunga = (_amount * bungaSimpananTahunanPersen * _tenorBulan) / 1200;

        userTimeDeposits[msg.sender].push(SimpananBerjangka({
            amount: _amount,
            lockUntil: block.timestamp + (_tenorBulan * 30 days),
            interestRate: estimasiBunga, 
            active: true
        }));

        dataAnggota[msg.sender].simpananSukarela -= _amount;
        saldoIDR.burn(msg.sender, _amount);
        totalSimpananSeluruhAnggota -= _amount;
        
        emit SimpananBerjangkaDibuka(msg.sender, _amount, _tenorBulan, block.timestamp); 
    }

    function cairkanSimpananBerjangka(uint256 _index) external hanyaAnggota openPeriod nonReentrant {
        require(_index < userTimeDeposits[msg.sender].length, "Data tidak ditemukan");
        SimpananBerjangka storage sb = userTimeDeposits[msg.sender][_index];
        require(sb.active, "Sudah dicairkan");
        require(block.timestamp >= sb.lockUntil, "Belum jatuh tempo");

        sb.active = false;
        
        dataAnggota[msg.sender].simpananSukarela += sb.amount;
        
        saldoIDR.mint(msg.sender, sb.amount);
        totalSimpananSeluruhAnggota += sb.amount;
        
        uint256 bungaCair = 0;
        if (sb.interestRate > 0 && profitBelumDibagi >= sb.interestRate) {
            profitBelumDibagi -= sb.interestRate;
            bungaCair = sb.interestRate;
            dataAnggota[msg.sender].simpananSukarela += bungaCair;
            
            saldoIDR.mint(msg.sender, bungaCair);
            totalSimpananSeluruhAnggota += bungaCair;
        }
        
        emit SimpananBerjangkaDicairkan(msg.sender, sb.amount, bungaCair, block.timestamp);
    }

    function tutupKeanggotaan(address _member) external hanyaPengurus nonReentrant {
        require(dataAnggota[_member].terdaftar, "Anggota tidak ditemukan");
        require(loanBalance[_member] == 0 && idPinjamanAktifAnggota[_member] == 0, "Ada pinjaman aktif");

        for (uint i = 0; i < userTimeDeposits[_member].length; i++) {
            require(!userTimeDeposits[_member][i].active, "Cairkan Simpanan Berjangka dulu");
        }

        uint256 totalRefund = dataAnggota[_member].simpananPokok + dataAnggota[_member].simpananWajib + dataAnggota[_member].simpananSukarela;
        require(settings.currentLiquidityPool >= totalRefund, "Likuiditas koperasi tidak cukup");
        
        saldoIDR.burn(_member, totalRefund);
        totalSimpananSeluruhAnggota -= totalRefund;
        settings.currentLiquidityPool -= totalRefund;
        
        dataAnggota[_member].simpananPokok = 0;
        dataAnggota[_member].simpananWajib = 0;
        dataAnggota[_member].simpananSukarela = 0;
        dataAnggota[_member].status = MemberStatus.Quit;

        emit MembershipClosed(_member, totalRefund);
    }

    function _getTotalSimpanan(address _user) internal view returns (uint256) {
        return saldoIDR.balanceOf(_user);
    }

    function getAllSimpananBerjangka(address _user) external view returns (SimpananBerjangka[] memory) {
        return userTimeDeposits[_user];
    }

    function getSimpananBerjangkaLength(address _user) external view returns (uint256) {
        return userTimeDeposits[_user].length;
    }

    function getAllMembers() external view returns (address[] memory addresses, Anggota[] memory members) {
        uint256 count = listAlamatAnggota.length;
        address[] memory addrs = new address[](count);
        Anggota[] memory datas = new Anggota[](count);

        for (uint256 i = 0; i < count; i++) {
            address addr = listAlamatAnggota[i];
            addrs[i] = addr;
            datas[i] = dataAnggota[addr];
        }
        return (addrs, datas);
    }

    function getLoansBatch(uint256 _start, uint256 _count) external view returns (Pinjaman[] memory) {
        uint256 total = idPinjamanTerakhir;
        if (_start > total) return new Pinjaman[](0);
        
        uint256 end = _start + _count - 1;
        if (end > total) end = total;
        
        uint256 size = end - _start + 1;
        Pinjaman[] memory items = new Pinjaman[](size);
        
        for (uint256 i = 0; i < size; i++) {
            items[i] = dataPinjaman[_start + i];
        }
        return items;
    }
}


