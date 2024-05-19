// SPDX-License: MIT
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

library PriceConverter {
    function getPrice(
        AggregatorV3Interface priceFeed
    ) internal view returns (uint256) {
        (
            ,
            /* uint80 roundId */ int256 price /* uint startedAt */ /* uint timeStamp */ /* uint80 answeredInRound */,
            ,
            ,

        ) = priceFeed.latestRoundData();

        // 3000.00000000
        return uint256(price * 1e10); // we want that value to have 18 decimals as well as wei
    }

    function getConversionRate(
        uint256 ethAmount,
        AggregatorV3Interface priceFeed
    ) internal view returns (uint256) {
        uint256 ethUsdPrice = getPrice(priceFeed);
        uint256 ethAmountInUsd = (ethUsdPrice * ethAmount) / 1e18;

        return ethAmountInUsd;
    }
}
