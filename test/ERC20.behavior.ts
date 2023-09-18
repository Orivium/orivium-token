import { expect } from "chai";
import { ethers } from "hardhat";
import { ERC20 } from "@orivium/types"
import { getNamedAccounts } from "./utils";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const MAX_UINT256 = 2n ** 256n - 1n;

const shouldBehaveLikeERC20 = (tokenContractName: string, initialSupply: bigint) => {
  let token: ERC20;
  let deployerAdrress: string;
  let crowdsaleBuyerAddress: string;
  let crowdsaleBuyer: HardhatEthersSigner;
  let crowdsaleFundsCollectorAddress: string;

  beforeEach(async () => {
    ({
        deployerAdrress, crowdsaleBuyerAddress, crowdsaleFundsCollectorAddress
    } = await getNamedAccounts());
    crowdsaleBuyer = await ethers.getSigner(crowdsaleBuyerAddress);
    token = await ethers.getContract(tokenContractName);
  })

  describe('total supply', async () => {
    it('returns the total amount of tokens', async () => {
      const totalSupply = await token.totalSupply();
      expect(totalSupply).to.equal(initialSupply);
    });
  });

  describe('balanceOf', async () => {
    describe('when the requested account has no tokens', async () => {
      it('returns zero', async () => {
        expect(await token.balanceOf(crowdsaleFundsCollectorAddress)).to.equal(0);
      });
    });

    describe('when the requested account has some tokens', async () => {
      it('returns the total amount of tokens', async () => {
        expect(await token.balanceOf(deployerAdrress)).to.equal(initialSupply);
      });
    });
  });

  describe('transfer', async () => {
    shouldBehaveLikeERC20Transfer(tokenContractName, initialSupply);
  });

  describe('transfer from', async () => {

    describe('when the token owner is not the zero address', async () => {

      describe('when the recipient is not the zero address', async () => {

        describe('when the spender has enough allowance', async () => {
          beforeEach(async () => {
            await token.approve(crowdsaleBuyerAddress, initialSupply);
          });

          describe('when the token owner has enough balance', async () => {

            it('transfers the requested amount', async () => {
              await token.connect(crowdsaleBuyer).transferFrom(deployerAdrress, crowdsaleFundsCollectorAddress, initialSupply);

              expect(await token.balanceOf(deployerAdrress)).to.equal(0);

              expect(await token.balanceOf(crowdsaleFundsCollectorAddress)).to.equal(initialSupply);
            });

            it('decreases the spender allowance', async () => {
              await token.connect(crowdsaleBuyer).transferFrom(deployerAdrress, crowdsaleFundsCollectorAddress, initialSupply);

              expect(await token.allowance(deployerAdrress, crowdsaleBuyerAddress)).to.equal(0);
            });

            it('emits a transfer event', async () => {
              await expect(token.connect(crowdsaleBuyer).transferFrom(deployerAdrress, crowdsaleFundsCollectorAddress, initialSupply))
                .to.emit(token, 'Transfer').withArgs(
                  deployerAdrress,
                  crowdsaleFundsCollectorAddress,
                  initialSupply
                );
            });

            it('emits an approval event', async () => {
              await expect(token.connect(crowdsaleBuyer).transferFrom(deployerAdrress, crowdsaleFundsCollectorAddress, initialSupply))
                .to.emit(token, 'Approval').withArgs(
                  deployerAdrress,
                  crowdsaleBuyerAddress,
                  0,
                );
            });
          });

          describe('when the token owner does not have enough balance', async () => {
            beforeEach(async () => {
              await token.transfer(crowdsaleFundsCollectorAddress, 1);
            });

            it('reverts', async () => {
              await expect(token.connect(crowdsaleBuyer).transferFrom(deployerAdrress, crowdsaleFundsCollectorAddress, initialSupply))
                .to.be.revertedWith('ERC20: transfer amount exceeds balance');
            });
          });
        });

        describe('when the spender does not have enough allowance', async () => {
          let allowance: bigint;
          beforeEach(async () => {
            allowance = initialSupply - 1n;
            await token.approve(crowdsaleBuyerAddress, allowance);
          });

          describe('when the token owner has enough balance', async () => {
            it('reverts', async () => {
              await expect(token.connect(crowdsaleBuyer).transferFrom(deployerAdrress, crowdsaleFundsCollectorAddress, initialSupply))
                .to.be.rejectedWith('ERC20: insufficient allowance');
            });
          });

          describe('when the token owner does not have enough balance', async () => {
            beforeEach(async () => {
              await token.transfer(crowdsaleFundsCollectorAddress, 2);
            });

            it('reverts', async () => {
              await expect(token.connect(crowdsaleBuyer).transferFrom(deployerAdrress, crowdsaleFundsCollectorAddress, allowance))
                .to.be.rejectedWith('ERC20: transfer amount exceeds balance');
            });
          });
        });

        describe('when the spender has unlimited allowance', async () => {
          beforeEach(async () => {
            await token.approve(crowdsaleBuyerAddress, MAX_UINT256);
          });

          it('does not decrease the spender allowance', async () => {
            await token.connect(crowdsaleBuyer).transferFrom(deployerAdrress, crowdsaleFundsCollectorAddress, 1);

            expect(await token.allowance(deployerAdrress, crowdsaleBuyerAddress)).to.equal(MAX_UINT256);
          });

          it('does not emit an approval event', async () => {
            expect(await token.connect(crowdsaleBuyer).transferFrom(deployerAdrress, crowdsaleFundsCollectorAddress, 1))
              .not.to.emit(token, 'Approval');
          });
        });
      });

      describe('when the recipient is the zero address', async () => {
        beforeEach(async () => {
          await token.approve(crowdsaleBuyerAddress, initialSupply);
        });

        it('reverts', async () => {
          await expect(token.connect(crowdsaleBuyer).transferFrom(deployerAdrress, ZERO_ADDRESS, initialSupply))
            .to.be.rejectedWith('ERC20: transfer to the zero address');
        });
      });
    });

    describe('when the token owner is the zero address', async () => {
      const amount = 0;
      const tokenOwner = ZERO_ADDRESS;

      it('reverts', async () => {
          await expect(token.connect(crowdsaleBuyer).transferFrom(tokenOwner, crowdsaleBuyerAddress, amount))
            .to.be.rejectedWith('from the zero address');
      });
    });
  });

  describe('approve', async () => {
    shouldBehaveLikeERC20Approve(tokenContractName, initialSupply);
  });

  describe('allowance', async () => {
    shouldBehaveLikeERC20Allowance(tokenContractName, initialSupply);
  });
}

const shouldBehaveLikeERC20Transfer = (tokenContractName: string, initialSupply: bigint) => {
  let token: ERC20;
  let deployerAdrress: string;
  let crowdsaleBuyerAddress: string;

  beforeEach(async () => {
    ({
        deployerAdrress, crowdsaleBuyerAddress
    } = await getNamedAccounts());
    token = await ethers.getContract(tokenContractName);
  })
  describe('when the recipient is not the zero address', async () => {
    describe('when the sender does not have enough balance', async () => {
      it('reverts', async () => {
        await expect(token.transfer(crowdsaleBuyerAddress, initialSupply + 1n))
          .to.be.revertedWith('ERC20: transfer amount exceeds balance');
      });
    });

    describe('when the sender transfers all balance', async () => {
      it('transfers the requested amount', async () => {
        const amount = initialSupply;
        await token.transfer(crowdsaleBuyerAddress, amount);

        expect(await token.balanceOf(deployerAdrress)).to.equal(0);

        expect(await token.balanceOf(crowdsaleBuyerAddress)).to.equal(amount);
      });

      it('emits a transfer event', async () => {
        await expect(token.transfer(crowdsaleBuyerAddress, initialSupply))
          .to.emit(token, 'Transfer').withArgs(
            deployerAdrress,
            crowdsaleBuyerAddress,
            initialSupply
        );
      });
    });

    describe('when the sender transfers zero tokens', async () => {
      it('transfers the requested amount', async () => {
        await token.transfer(crowdsaleBuyerAddress, 0);

        expect(await token.balanceOf(deployerAdrress)).to.equal(initialSupply);

        expect(await token.balanceOf(crowdsaleBuyerAddress)).to.equal('0');
      });

      it('emits a transfer event', async () => {
        await expect(token.transfer(crowdsaleBuyerAddress, 0))
          .to.emit(token, 'Transfer').withArgs(
          deployerAdrress,
          crowdsaleBuyerAddress,
          0
        );
      });
    });
  });

  describe('when the recipient is the zero address', async () => {
    it('reverts', async () => {
      await expect(token.transfer(ZERO_ADDRESS, initialSupply))
        .to.be.rejectedWith('ERC20: transfer to the zero address');
    });
  });
}

const shouldBehaveLikeERC20Approve = (tokenContractName: string, initialSupply: bigint) => {
  let token: ERC20;
  let deployerAdrress: string;
  let crowdsaleBuyerAddress: string;

  beforeEach(async () => {
    ({
        deployerAdrress, crowdsaleBuyerAddress
    } = await getNamedAccounts());
    token = await ethers.getContract(tokenContractName);
  })
  describe('when the spender is not the zero address', async () => {
    describe('when the sender has enough balance', async () => {
      it('emits an approval event', async () => {
        await expect(token.approve(crowdsaleBuyerAddress, initialSupply))
          .to.emit(token, 'Approval').withArgs(
          deployerAdrress,
          crowdsaleBuyerAddress,
          initialSupply,
        );
      });

      describe('when there was no approved amount before', async () => {
        it('approves the requested amount', async () => {
          await token.approve(crowdsaleBuyerAddress, initialSupply);

          expect(await token.allowance(deployerAdrress, crowdsaleBuyerAddress)).to.equal(initialSupply);
        });
      });

      describe('when the spender had an approved amount', async () => {
        beforeEach(async () => {
          await token.approve(crowdsaleBuyerAddress, 1n);
        });

        it('approves the requested amount and replaces the previous one', async () => {
          await token.approve(crowdsaleBuyerAddress, initialSupply);
          
          expect(await token.allowance(deployerAdrress, crowdsaleBuyerAddress)).to.equal(initialSupply);
        });
      });
    });

    describe('when the sender does not have enough balance', async () => {
      it('emits an approval event', async () => {
        const amount = initialSupply + 1n;
        await expect(token.approve(crowdsaleBuyerAddress, amount))
          .to.emit(token, 'Approval').withArgs(
          deployerAdrress,
          crowdsaleBuyerAddress,
          amount,
        );
      });

      describe('when there was no approved amount before', async () => {
        it('approves the requested amount', async () => {
          const amount = initialSupply + 1n;
          await token.approve(crowdsaleBuyerAddress, amount);

          expect(await token.allowance(deployerAdrress, crowdsaleBuyerAddress)).to.equal(amount);
        });
      });

      describe('when the spender had an approved amount', async () => {
        beforeEach(async () => {
          await token.approve(crowdsaleBuyerAddress, 1n);
        });

        it('approves the requested amount and replaces the previous one', async () => {
          const amount = initialSupply + 1n;
          await token.approve(crowdsaleBuyerAddress, amount);

          expect(await token.allowance(deployerAdrress, crowdsaleBuyerAddress)).to.equal(amount);
        });
      });
    });
  });

  describe('when the spender is the zero address', async () => {
    it('reverts', async () => {
      await expect(token.approve(ZERO_ADDRESS, initialSupply))
      .to.be.rejectedWith('ERC20: approve to the zero address');
    });
  });
}

const shouldBehaveLikeERC20Allowance = (tokenContractName: string, initialSupply: bigint) => {
  let token: ERC20;
  let deployerAdrress: string;
  let crowdsaleBuyerAddress: string;

  beforeEach(async () => {
    ({
        deployerAdrress, crowdsaleBuyerAddress
    } = await getNamedAccounts());
    token = await ethers.getContract(tokenContractName);
  })
  describe('decrease allowance', async () => {
    describe('when the spender is not the zero address', async () => {

      function shouldDecreaseApproval(supplyToAdd: bigint) {
        describe('when there was no approved amount before', async () => {
          it('reverts', async () => {
            const amount = initialSupply + supplyToAdd;
            await expect(token.decreaseAllowance(crowdsaleBuyerAddress, amount))
                .to.be.revertedWith('ERC20: decreased allowance below zero');
          });
        });

        describe('when the spender had an approved amount', async () => {
          let approvedAmount: bigint;

          beforeEach(async () => {
            approvedAmount = initialSupply + supplyToAdd;
            await token.approve(crowdsaleBuyerAddress, approvedAmount);
          });

          it('emits an approval event', async () => {
            await expect(token.decreaseAllowance(crowdsaleBuyerAddress, approvedAmount))
              .to.emit(token, 'Approval').withArgs(
                deployerAdrress,
                crowdsaleBuyerAddress,
                0n
            );
          });

          it('decreases the spender allowance subtracting the requested amount', async () => {
            await token.decreaseAllowance(crowdsaleBuyerAddress, approvedAmount - 1n);

            expect(await token.allowance(deployerAdrress, crowdsaleBuyerAddress)).to.equal(1);
          });

          it('sets the allowance to zero when all allowance is removed', async () => {
            await token.decreaseAllowance(crowdsaleBuyerAddress, approvedAmount);
            expect(await token.allowance(deployerAdrress, crowdsaleBuyerAddress)).to.equal(0);
          });

          it('reverts when more than the full allowance is removed', async () => {
            await expect(token.decreaseAllowance(crowdsaleBuyerAddress, approvedAmount + 1n))
              .to.be.revertedWith('ERC20: decreased allowance below zero');
          });
        });
      }

      describe('when the sender has enough balance', async () => {
        shouldDecreaseApproval(0n);
      });

      describe('when the sender does not have enough balance', async () => {
        shouldDecreaseApproval(1n);
      });
    });

    describe('when the spender is the zero address', async () => {
      it('reverts', async () => {
        await expect(token.decreaseAllowance(ZERO_ADDRESS, initialSupply))
          .to.be.revertedWith('ERC20: decreased allowance below zero');
      });
    });
  });

  describe('increase allowance', async () => {
    describe('when the spender is not the zero address', async () => {

      describe('when the sender has enough balance', async () => {
        it('emits an approval event', async () => {
          await expect(token.increaseAllowance(crowdsaleBuyerAddress, initialSupply))
            .to.emit(token, 'Approval').withArgs(
              deployerAdrress,
              crowdsaleBuyerAddress,
              initialSupply,
          );
        });

        describe('when there was no approved amount before', async () => {
          it('approves the requested amount', async () => {
            await token.increaseAllowance(crowdsaleBuyerAddress, initialSupply);

            expect(await token.allowance(deployerAdrress, crowdsaleBuyerAddress)).to.equal(initialSupply);
          });
        });

        describe('when the spender had an approved amount', async () => {
          beforeEach(async () => {
            await token.approve(crowdsaleBuyerAddress, 1n);
          });

          it('increases the spender allowance adding the requested amount', async () => {
            await token.increaseAllowance(crowdsaleBuyerAddress, initialSupply);

            expect(await token.allowance(deployerAdrress, crowdsaleBuyerAddress)).to.equal(initialSupply + 1n);
          });
        });
      });

      describe('when the sender does not have enough balance', async () => {
        let amount: bigint;
        
        beforeEach(async () => {
          amount = initialSupply + 1n;
        });

        it('emits an approval event', async () => {
          await expect(token.increaseAllowance(crowdsaleBuyerAddress, amount))
            .to.emit(token, 'Approval').withArgs(
              deployerAdrress,
              crowdsaleBuyerAddress,
              amount,
          );
        });

        describe('when there was no approved amount before', async () => {
          it('approves the requested amount', async () => {
            await token.increaseAllowance(crowdsaleBuyerAddress, amount);
            const allowance = await token.allowance(deployerAdrress, crowdsaleBuyerAddress);
            expect(allowance).to.equal(amount);
          });
        });

        describe('when the spender had an approved amount', async () => {
          beforeEach(async () => {
            await token.approve(crowdsaleBuyerAddress, 1n);
          });

          it('increases the spender allowance adding the requested amount', async () => {
            await token.increaseAllowance(crowdsaleBuyerAddress, amount);
            const allowance = await token.allowance(deployerAdrress, crowdsaleBuyerAddress);
            expect(allowance).to.equal(amount + 1n);
          });
        });
      });
    });

    describe('when the spender is the zero address', async () => {
      it('reverts', async () => {
        await expect(token.increaseAllowance(ZERO_ADDRESS, initialSupply))
          .to.be.rejectedWith('ERC20: approve to the zero address');
      });
    });
  });
}

export {
  shouldBehaveLikeERC20,
  shouldBehaveLikeERC20Transfer,
  shouldBehaveLikeERC20Approve,
  shouldBehaveLikeERC20Allowance,
};