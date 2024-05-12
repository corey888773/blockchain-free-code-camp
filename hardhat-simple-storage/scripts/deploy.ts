import { ethers, run, network } from "hardhat";
import "dotenv/config";

async function main() {
    const SimpleStorageFactory = await ethers.getContractFactory("SimpleStorage");

    console.log("Deploying SimpleStorage...");
    const simpleStorage = await SimpleStorageFactory.deploy();
    await simpleStorage.waitForDeployment();
    const address = await simpleStorage.getAddress();
    console.log("SimpleStorage deployed to:", address);

    if (process.env.ETHERSCAN_API_KEY && process.env.CHAIN_ID == network.config.chainId) {
        await verify(address, []);
    }

    const currentValue = await simpleStorage.retrieve();
    console.log("Current value:", currentValue.toString());

    console.log("Setting new value...");
    const transaction = await simpleStorage.store(42);
    await transaction.wait(1);

    const newValue = await simpleStorage.retrieve();
    console.log("New value:", newValue.toString());

    console.log("All done!");
}

async function verify(contractAddress: string, args: any[]) {
    console.log("Verifying contract...");

    try {
        await run("verify:verify", {
            address: contractAddress,
            constructorArguments: args,
        });
    } catch (error: any) {
        if (error.message.toLowerCase().includes("already verified")) {
            console.log("Contract already verified");
        }
        else {
            console.log(error);

        }
    }
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });