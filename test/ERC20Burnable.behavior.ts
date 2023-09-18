import { expect } from "chai";
import { ethers } from "hardhat";
import { ERC20Burnable } from "@orivium/types"
import { getNamedAccounts } from "./utils";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

const shouldBehaveLikeERC20Burnable = (tokenContractName: string, initialSupply: bigint) => {
  let token: ERC20Burnable;
  let deployerAdrress: string;
  let crowdsaleBuyerAddress: string;
  let crowdsaleBuyer: HardhatEthersSigner;

  beforeEach(async () => {
    ({
        deployerAdrress, crowdsaleBuyerAddress
    } = await getNamedAccounts());
    crowdsaleBuyer = await ethers.getSigner(crowdsaleBuyerAddress);
    token = await ethers.getContract(tokenContractName);
  })
  describe('burn', () => {
    describe('when the given amount is not greater than balance of the sender', () => {
      describe('for a zero amount', () => {
        shouldBurn(0n);
      });

      describe('for a non-zero amount', () => {
        shouldBurn(100n);
      });

      function shouldBurn(amount: bigint) {
        it('burns the requested amount', async () => {
          await token.burn(amount);
          expect(await token.balanceOf(deployerAdrress)).to.equal(initialSupply - amount);
        });

        it('emits a transfer event', async () => {
          await expect(token.burn(amount))
            .to.emit(token, 'Transfer').withArgs(
            deployerAdrress,
            ZERO_ADDRESS,
            amount,
          );
        });
      }
    });

    describe('when the given amount is greater than the balance of the sender', async () => {
      it('reverts', async () => {
        await expect(token.burn(initialSupply + 1n))
          .to.be.rejectedWith('ERC20: burn amount exceeds balance');
      });
    });
  });

  describe('burnFrom', () => {
    describe('on success', () => {
      describe('for a zero amount', () => {
        shouldBurnFrom(0n);
      });

      describe('for a non-zero amount', () => {
        shouldBurnFrom(100n);
      });

      function shouldBurnFrom(amount: bigint) {
        const originalAllowance = amount * 3n;

        describe("memory check", () => {
          beforeEach(async () => {
            await token.approve(crowdsaleBuyerAddress, originalAllowance);
            await token.connect(crowdsaleBuyer).burnFrom(deployerAdrress, amount);
          });
  
          it('burns the requested amount', async () => {
            expect(await token.balanceOf(deployerAdrress)).to.equal(initialSupply - amount);
          });
  
          it('decrements allowance', async () => {
            expect(await token.allowance(deployerAdrress, crowdsaleBuyerAddress)).to.equal(originalAllowance - amount);
          });

        });

        it('emits a transfer event', async () => {
          await token.approve(crowdsaleBuyerAddress, originalAllowance);
          await expect(token.connect(crowdsaleBuyer).burnFrom(deployerAdrress, amount))
            .to.emit(token, 'Transfer').withArgs(
            deployerAdrress,
            ZERO_ADDRESS,
            amount,
          );
        });
      }
    });

    describe('when the given amount is greater than the balance of the sender', async () => {
      it('reverts', async () => {
        const amount = initialSupply + 1n;
        await token.approve(crowdsaleBuyerAddress, amount);
        await expect(token.connect(crowdsaleBuyer).burnFrom(deployerAdrress, amount))
          .to.be.rejectedWith('ERC20: burn amount exceeds balance');
      });
    });

    describe('when the given amount is greater than the allowance', () => {
      it('reverts', async () => {
        await token.approve(crowdsaleBuyerAddress, 100);
        await expect(token.connect(crowdsaleBuyer).burnFrom(deployerAdrress, 101))
          .to.be.rejectedWith('ERC20: insufficient allowance');
      });
    });
  });
}

export {
  shouldBehaveLikeERC20Burnable,
};