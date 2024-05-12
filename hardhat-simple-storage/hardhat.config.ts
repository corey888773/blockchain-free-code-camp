import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import "dotenv/config";
import "./tasks/block-number";
import "hardhat-gas-reporter";

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL!
const PRIVATE_KEY = process.env.PRIVATE_KEY!
const CHAIN_ID = parseInt(process.env.CHAIN_ID!)
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY!
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY!

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  networks: {
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: [
        PRIVATE_KEY
      ],
      chainId: CHAIN_ID
    },
    localhost: {
      url: "http://127.0.0.1:8545"
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY
  },
  solidity: "0.8.24",
  gasReporter: {
    currency: "USD",
    gasPrice: 21,
    enabled: true,
    coinmarketcap: COINMARKETCAP_API_KEY

  }
};

export default config;
