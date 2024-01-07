// contracts/ORIToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

/**
 * @dev Implementation of the ORIToken contract.
 * Based on the OpenZeppelin implementation of ERC20, ERC20Burnable and ERC20Permit.
 */
contract ORIToken is ERC20, ERC20Burnable, ERC20Permit {
    constructor(uint256 initialSupply) ERC20("Ori", "ORI") ERC20Permit("Ori") {
        _mint(_msgSender(), initialSupply);
    }
}
