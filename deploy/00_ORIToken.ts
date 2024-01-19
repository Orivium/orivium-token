import { DeployFunction } from "hardhat-deploy/types";

import { multiSigWallets, isSupportedNetwork } from "../utils/multiSigWallet";

const ORI_TOTAL_SUPPLY = 100000000000000000000000000n;

const deployFunction: DeployFunction = async({ getNamedAccounts, deployments, network }) => {
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    if (!deployer) throw new Error("deployer is undefined");
    if (!isSupportedNetwork(network.name)) throw new Error("network not supported: " + network.name);
    const multiSigWallet = multiSigWallets[network.name] ?? deployer;

    await deploy("ORIToken", {
        from: deployer,
        args: [
            ORI_TOTAL_SUPPLY,
            multiSigWallet,
        ],
        log: true,
    });
};

export default deployFunction;
deployFunction.tags = ['all', 'ORIToken', 'main'];

