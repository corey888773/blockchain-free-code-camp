import { deployments, getNamedAccounts, ethers, network } from "hardhat";
import { FundMe, FundMe__factory, MockV3Aggregator, MockV3Aggregator__factory } from "../../typechain-types";
import { expect, assert } from "chai";
import { developmentChains } from "../../helper-hardhat-config";

!developmentChains.includes(network.name) ?
    describe.skip :
    describe("FundMe", async () => {
        let fundMe: FundMe;
        let mockV3Aggregator: MockV3Aggregator;
        let deployer: string;
        const sufficientFunds = ethers.parseUnits("1.0", "ether");

        beforeEach(async () => {
            deployer = (await getNamedAccounts()).deployer
            const signer = await ethers.getSigner(deployer)
            await deployments.fixture(["all"])

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

            let mockV3AggregatorDeployment = await deployments.get("MockV3Aggregator")
            const mockV3AggregatorContract = await ethers.getContractAt(
                "MockV3Aggregator",
                mockV3AggregatorDeployment.address,
                signer
            )
            mockV3Aggregator = MockV3Aggregator__factory.connect(
                await mockV3AggregatorContract.getAddress(),
                signer
            )
        });

        describe("Constructor", async () => {
            it("Sets the aggregator", async () => {
                const response = await fundMe.getPriceFeed();
                expect(response).to.eq(await mockV3Aggregator.getAddress());
            });
        });

        describe("Fund", async () => {
            it("Should revert if the amount is less than the minimum", async () => {
                await expect(fundMe.fund({ value: 0 })).to.be.revertedWith("Send more ETH!");
            });

            it("Updated the adressToAmountFunded", async () => {
                await fundMe.fund({ value: sufficientFunds });
                const response = await fundMe.getAdressToAmountFunded(
                    deployer
                );
                expect(response).to.eq(sufficientFunds);
            });

            it("Updated the funders array", async () => {
                await fundMe.fund({ value: sufficientFunds });
                const response = await fundMe.getFunder(0);
                expect(response).to.eq(deployer);
            });
        });

        describe("Withdraw", async () => {
            beforeEach(async () => {
                await fundMe.fund({ value: sufficientFunds });
            });

            it("Withdraw ETH from a single founder", async () => {
                // Arrange
                const startingDeployerBalance = await ethers.provider.getBalance(deployer);
                const startingContractBalance = await ethers.provider.getBalance(fundMe.getAddress());

                // Act
                const transaction = await fundMe.withdraw();
                const transactionReceipt = await transaction.wait();
                const { gasUsed, gasPrice } = transactionReceipt!;
                const transactionCost = gasUsed * gasPrice;

                const finalDeployerBalance = await ethers.provider.getBalance(deployer);
                const finalContractBalance = await ethers.provider.getBalance(fundMe.getAddress());

                // Assert
                assert.equal(finalContractBalance.toString(), "0");
                assert.equal(
                    (finalDeployerBalance + transactionCost).toString(),
                    (startingDeployerBalance + startingContractBalance).toString()
                )
            });

            it("Withdraw ETH from multiple founders", async () => {
                // Arrange
                const accounts = await ethers.getSigners();
                for (let i = 1; i < 6; i++) {
                    await fundMe.connect(accounts[i]).fund({ value: sufficientFunds });
                }
                const startingDeployerBalance = await ethers.provider.getBalance(deployer);
                const startingContractBalance = await ethers.provider.getBalance(fundMe.getAddress());

                // Act
                const transaction = await fundMe.withdraw();
                const transactionReceipt = await transaction.wait();
                const { gasUsed, gasPrice } = transactionReceipt!;
                const transactionCost = gasUsed * gasPrice;

                const finalDeployerBalance = await ethers.provider.getBalance(deployer);
                const finalContractBalance = await ethers.provider.getBalance(fundMe.getAddress());

                // Assert
                assert.equal(finalContractBalance.toString(), "0");
                assert.equal(
                    (finalDeployerBalance + transactionCost).toString(),
                    (startingDeployerBalance + startingContractBalance).toString()
                );

                await expect(fundMe.getFunder(0)).to.be.reverted;
                for (let i = 1; i < 6; i++) {
                    expect(await fundMe.getAdressToAmountFunded(accounts[i].address)).to.be.eq(0);
                }
            });

            it("Only allows the owner to withdraw", async () => {
                const attacker = await ethers.provider.getSigner(1);
                await expect(fundMe.connect(attacker).withdraw()).to.be.revertedWithCustomError(fundMe, "FundMe__NotOwner")
            });
        });
    });