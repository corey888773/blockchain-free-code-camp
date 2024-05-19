import { deployments, ethers, getNamedAccounts } from "hardhat";



async function main() {
    const { deployer } = await getNamedAccounts();
    const signer = await ethers.getSigner(deployer);

    console.log("Funding contract...");
    const fundMeDeployment = await deployments.get("FundMe");
    const fundMeContract = await ethers.getContractAt(
        "FundMe",
        fundMeDeployment.address,
        signer
    );

    const fundMe = fundMeContract.connect(signer);
    const amount = ethers.parseEther("0.1");
    const transaction = await fundMe.fund({ value: amount });
    await transaction.wait();

    console.log("Funded successfully");
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });