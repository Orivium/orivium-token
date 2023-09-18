import { expect } from 'chai';
import { ethers, deployments } from 'hardhat';
import { shouldBehaveLikeERC20 } from './ERC20.behavior';
import { shouldBehaveLikeERC20Burnable } from './ERC20Burnable.behavior';
// import { getNamedAccounts } from '../../utils';
import { ORIToken } from "@orivium/types";

describe('ERC20', () => {
  let token: ORIToken;
  const tokenContractName = "ORIToken";
  const initialSupply = 100000000000000000000000000n;

  beforeEach(async () => {
    await deployments.fixture([tokenContractName]);
    token = await ethers.getContract("ORIToken");
  });

  it('has a name', async () => {
    expect(await token.name()).to.equal("Ori");
  });

  it('has a symbol', async () => {
    expect(await token.symbol()).to.equal("ORI");
  });

  it('has 18 decimals', async () => {
    expect(await token.decimals()).to.equal(18);
  });

  shouldBehaveLikeERC20(tokenContractName, initialSupply);
  shouldBehaveLikeERC20Burnable(tokenContractName, initialSupply);
});
