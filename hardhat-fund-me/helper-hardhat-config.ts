export interface NetworkConfig {
    [networkId: number]: {
        name: string;
        ethPriceFeedAddress: string;
    };
}

export const networkConfig: NetworkConfig = {
    11155111: {
        name: "sepolia",
        ethPriceFeedAddress: "0x694AA1769357215DE4FAC081bf1f309aDC325306",
    },
    31337: {
        name: "localhost",
        ethPriceFeedAddress: "0x8A753747A1Fa494EC906cE90E9f37563A8AF630e",
    },
};

export const developmentChains = ["hardhat", "localhost"];
export const DECIMALS = 8;
export const INITIAL_PRICE = 300000000000; 