import { assert, expect } from "chai";
import { Contract, ContractTransactionResponse } from "ethers";
import { ethers } from "hardhat";
import { SimpleStorage, SimpleStorage__factory } from "../typechain-types";

describe("SimpleStorage", function () {
    let simpleStorageFactory: SimpleStorage__factory, simpleStorage: SimpleStorage;
    this.beforeEach(async function () {
        simpleStorageFactory = await ethers.getContractFactory("SimpleStorage");
        simpleStorage = await simpleStorageFactory.deploy();
        await simpleStorage.waitForDeployment();
    });

    it("Should start with a value of 0", async function () {
        const currentValue = await simpleStorage.retrieve();
        const expectedValue = "0";

        assert.equal(currentValue.toString(), expectedValue);
    });

    it("Should update the value when calling store", async function () {
        const expectedValue = "42";
        const transaction = await simpleStorage.store(42);
        await transaction.wait(1);
        const newValue = await simpleStorage.retrieve();

        expect(newValue.toString()).to.equal(expectedValue);
    })
})