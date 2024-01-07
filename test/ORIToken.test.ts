import { expect } from 'chai';
import { ethers, deployments } from 'hardhat';
import { ORIToken } from "@orivium/types";

describe('ERC20', () => {
  let token: ORIToken;

  beforeEach(async () => {
    await deployments.fixture(["ORIToken"]);
    token = await ethers.getContract("ORIToken");
  });

  it('has a name', async () => {
    expect(await token.name()).to.equal("Orivium");
  });

  it('has a symbol', async () => {
    expect(await token.symbol()).to.equal("ORI");
  });

  it('has 18 decimals', async () => {
    expect(await token.decimals()).to.equal(18);
  });

  // no need to test behaviors while they are tested in OpenZeppelin's ERC20 tests
  // https://github.com/OpenZeppelin/openzeppelin-contracts/tree/v5.0.0/test/token/ERC20
});
