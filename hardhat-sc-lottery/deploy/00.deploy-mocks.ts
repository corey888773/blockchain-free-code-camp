import { ethers, network } from 'hardhat'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { developmentChains } from '../helper-hardhat-config'

const BASE_FEE = ethers.parseEther('0.25')
const GAS_PRICE_LINK = 1e9

module.exports = async (hre: HardhatRuntimeEnvironment) => {
    const { deployments, getNamedAccounts } = hre
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId!
    const args = [BASE_FEE, GAS_PRICE_LINK]

    if (developmentChains.includes(network.name)) {
        console.log('Development network! Deploying Mocks...')

        await deploy('VRFCoordinatorV2Mock', {
            from: deployer,
            log: true,
            args: args,
        })
        log('VRFCoordinatorV2Mock deployed!')
        log('-'.repeat(50))
    }
}

module.exports.tags = ['VRFCoordinatorV2Mock', 'all']
