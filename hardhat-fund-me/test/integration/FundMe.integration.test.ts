import { deployments, ethers, getNamedAccounts, network } from "hardhat";
import { developmentChains } from "../../helper-hardhat-config";
import { FundMe, MockV3Aggregator, FundMe__factory, MockV3Aggregator__factory } from "../../typechain-types";
import { expect } from "chai";

developmentChains.includes(network.name) ?
    describe.skip :
    describe("FundMe", () => {
        let fundMe: FundMe;
        let deployer: string;
        const sufficientFunds = ethers.parseUnits("0.1", "ether");

        beforeEach(async () => {
            deployer = (await getNamedAccounts()).deployer
            const signer = await ethers.getSigner(deployer)

            const fundMeDeployment = await deployments.get("FundMe")
            const fundMeContract = await ethers.getContractAt(
                "FundMe",
                fundMeDeployment.address,
                signer
            )
            fundMe = FundMe__factory.connect(
                await fundMeContract.getAddress(),
                signer
            )
        });

        it("Allows to fund and withdraw", async () => {
            await fundMe.fund({ value: sufficientFunds });
            await fundMe.withdraw();

            const finalContractBalance = await ethers.provider.getBalance(fundMe.getAddress());
            expect(finalContractBalance).to.eq(0);
        });
    });