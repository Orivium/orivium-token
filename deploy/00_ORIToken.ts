import { DeployFunction } from "hardhat-deploy/types";

import { multiSigWallets, isSupportedNetwork } from "../utils/multiSigWallet";

const ORI_TOTAL_SUPPLY = 100000000000000000000000000n;

const deployFunction: DeployFunction = async({ getNamedAccounts, deployments, network , run }) => {
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
        waitConfirmations: network.name === "hardhat" ? 0 : 1,
    });

    await run("verify:verify", {
        address: (await deployments.get("ORIToken")).address,
        contract: "contracts/ORIToken.sol:ORIToken",
        constructorArguments: [
            ORI_TOTAL_SUPPLY,
            multiSigWallet,
        ],
    });
};

export default deployFunction;
deployFunction.tags = ['all', 'ORIToken', 'main'];

