// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./PriceConverter.sol";

error FundMe__NotOwner();

/**
 * @title FundMe
 * @author Piotr Gąsiorek
 * @notice This contract allows to fund the contract with a minimum amount of USD
 * @dev The contract has a minimum amount of USD that can be funded
 */
contract FundMe {
    // Type declarations
    using PriceConverter for uint256;

    // State variables
    uint256 constant MINIMUM_USD = 50 * 1e18;
    address private immutable i_owner;

    address[] private s_funders;
    mapping(address => uint256) private s_addressToAmountFunded;
    AggregatorV3Interface private s_priceFeed;

    modifier onlyOwner() {
        // require(msg.sender == i_owner, "this can be done only by the owner");
        if (msg.sender != i_owner) {
            revert FundMe__NotOwner();
        }
        _;
    }

    constructor(address s_priceFeedAddress) {
        i_owner = msg.sender;
        s_priceFeed = AggregatorV3Interface(s_priceFeedAddress);
    }

    receive() external payable {
        fund();
    }

    fallback() external payable {
        fund();
    }

    function fund() public payable {
        // 1e18 = 1_000_000_000_000_000_000 wei
        require(
            msg.value.getConversionRate(s_priceFeed) > MINIMUM_USD,
            "Send more ETH!"
        );
        s_funders.push(msg.sender);
        s_addressToAmountFunded[msg.sender] += msg.value;
    }

    function expensive_withdraw() public onlyOwner {
        for (uint256 i; i < s_funders.length; i++) {
            address funder = s_funders[i];
            s_addressToAmountFunded[funder] = 0;
        }
        s_funders = new address[](0);

        // withdraw
        // transfer throws, has 2800 gas limit
        // payable(msg.sender).transfer(address(this).balance);

        // returns bool, has 2800 gas limit
        // bool sendSuccess = payable(msg.sender).send(address(this).balance);
        // require(sendSuccess, "send failed!");

        // most powerful, does not have any limits
        (bool callSuccess /* bytes memory msgData */, ) = payable(msg.sender)
            .call{value: address(this).balance}("");
        require(callSuccess, "call failed");
    }

    function withdraw() public onlyOwner {
        address[] memory funders = s_funders; // gas optimization
        for (uint256 i; i < funders.length; i++) {
            address funder = funders[i];
            s_addressToAmountFunded[funder] = 0;
        }
        s_funders = new address[](0);
        (bool callSuccess /* bytes memory msgData */, ) = payable(msg.sender)
            .call{value: address(this).balance}("");
        require(callSuccess, "call failed");
    }

    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getFunder(uint256 index) public view returns (address) {
        return s_funders[index];
    }

    function getAdressToAmountFunded(
        address funder
    ) public view returns (uint256) {
        return s_addressToAmountFunded[funder];
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }
}
