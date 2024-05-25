import { ethers } from 'hardhat'

export interface NetworkConfig {
    [networkId: number]: {
        name: string
        vrfCoordinatorV2: string
        entranceFee: bigint
        gasLane: string
        subscriptionId: string
        callBackGasLimit: string
        interval: string
    }
}

export const networkConfig: NetworkConfig = {
    11155111: {
        name: 'sepolia',
        vrfCoordinatorV2: '0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625',
        entranceFee: ethers.parseEther('0.01'),
        gasLane: '0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c',
        subscriptionId: '11794',
        callBackGasLimit: '500000',
        interval: '30',
    },
    31337: {
        name: 'localhost',
        vrfCoordinatorV2: '',
        entranceFee: ethers.parseEther('0.01'),
        gasLane: '0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c',
        subscriptionId: '11794',
        callBackGasLimit: '500000',
        interval: '30',
    },
}

export const developmentChains = ['hardhat', 'localhost']
export const DECIMALS = 8
export const INITIAL_PRICE = 300000000000
