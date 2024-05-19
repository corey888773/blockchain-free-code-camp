import { network } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { networkConfig, developmentChains } from "../helper-hardhat-config";
import { verify } from "../utils/verify";


module.exports = async (hre: HardhatRuntimeEnvironment) => {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId!;

    let ethPriceFeedAddress;
    if (developmentChains.includes(network.name)) {
        const MockV3Aggregator = await deployments.get("MockV3Aggregator");
        ethPriceFeedAddress = MockV3Aggregator.address;
    }
    else {
        ethPriceFeedAddress = networkConfig[chainId].ethPriceFeedAddress;
    }

    const args = [ethPriceFeedAddress];
    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: args,
        log: true,
    });

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        await verify(fundMe.address, args);
    }

    console.log(`-`.repeat(50));
}

module.exports.tags = ["all", "fund-me"];