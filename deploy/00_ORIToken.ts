import { DeployFunction } from "hardhat-deploy/types";

const ORI_TOTAL_SUPPLY = 100000000000000000000000000n;

const deployFunction: DeployFunction = async({ getNamedAccounts, deployments }) => {
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    if (!deployer) return;

    await deploy("ORIToken", {
        from: deployer,
        args: [ORI_TOTAL_SUPPLY],
        log: true,
    });
};

export default deployFunction;
deployFunction.tags = ['all', 'ORIToken', 'main'];

