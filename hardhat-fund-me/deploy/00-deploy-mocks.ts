import { network } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { networkConfig, developmentChains, DECIMALS, INITIAL_PRICE } from "../helper-hardhat-config";


module.exports = async (hre: HardhatRuntimeEnvironment) => {
    const { deployments, getNamedAccounts } = hre;
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId!;

    if (developmentChains.includes(network.name)) {
        console.log("Development network! Deploying Mocks...");
        await deploy("MockV3Aggregator", {
            from: deployer,
            log: true,
            args: [DECIMALS, INITIAL_PRICE],
        });

        console.log("Mock deployed!");
        console.log("-".repeat(50));
    }
}


module.exports.tags = ["all", "mocks"];