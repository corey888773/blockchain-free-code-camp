import { ethers } from "ethers";
import fs from "fs";

async function main() {
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:7545");
    const wallet = new ethers.Wallet("0xfc8f199d791e6af08c6202465a234490ed43afa38c9120c4dee0c91a17fb1966", provider);
    const abi = fs.readFileSync("./SimpleStorage_sol_SimpleStorage.abi", "utf8");
    const bytecode = fs.readFileSync("./SimpleStorage_sol_SimpleStorage.bin", "utf8");

    const factory = new ethers.ContractFactory(abi, bytecode, wallet);
    const contract = await factory.deploy();
    const deploymentReceipt = await contract.waitForDeployment();

    console.log("Here is the deployment transaction");
    console.log(contract.deploymentTransaction());
    console.log("Here is the deployment receipt");
    console.log(deploymentReceipt);
}


main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });