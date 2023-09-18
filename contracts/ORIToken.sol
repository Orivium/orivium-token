// contracts/token/ERC20/ORIToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { ERC20Burnable } from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

/**
 * @dev Implementation of the ORIToken contract.
 *
 * Based on the OpenZeppelin implementation of ERC20 and ERC20Burnable.
 *
 * This token serves as governance token for the orivium organisation
 */
contract ORIToken is ERC20, ERC20Burnable {
	/**
	 * @dev creates an ORIToken contract and mints the given initial supply of tokens,
	 * which are then assigned to the deployer's address.
	 */
	constructor(uint256 initialSupply) ERC20("Ori", "ORI") {
		_mint(_msgSender(), initialSupply);
	}
}
