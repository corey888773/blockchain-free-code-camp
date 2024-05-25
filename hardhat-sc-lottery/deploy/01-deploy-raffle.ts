import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { developmentChains, networkConfig } from '../helper-hardhat-config'
import { ethers, network } from 'hardhat'
import { verify } from '../utils/verify'
import { SubscriptionCreatedEvent } from '../typechain-types/@chainlink/contracts/src/v0.8/vrf/mocks/VRFCoordinatorV2Mock'

const SUBSCRIPTION_FUND_AMOUNT = ethers.parseEther('30')

module.exports = async function (hre: HardhatRuntimeEnvironment) {
    const { getNamedAccounts, deployments } = hre
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const signer = await ethers.getSigner(deployer)
    const chainId = network.config.chainId!
    let VRFCoordinatorV2Address, subscriptionId

    if (developmentChains.includes(network.name)) {
        const VRFCoordinatorV2MockDeployment = await deployments.get('VRFCoordinatorV2Mock')
        const VRFCoordinatorV2Mock = await ethers.getContractAt(
            'VRFCoordinatorV2Mock',
            VRFCoordinatorV2MockDeployment.address,
            signer
        )

        VRFCoordinatorV2Address = await VRFCoordinatorV2Mock.getAddress()
        const filter = VRFCoordinatorV2Mock.filters.SubscriptionCreated()

        const createSubscriptionTx = await VRFCoordinatorV2Mock.createSubscription()
        await createSubscriptionTx.wait()
        const events = await VRFCoordinatorV2Mock.queryFilter(filter)
        subscriptionId = events[0].args[0] // Subscription ID

        await VRFCoordinatorV2Mock.fundSubscription(subscriptionId!, SUBSCRIPTION_FUND_AMOUNT)
    } else {
        VRFCoordinatorV2Address = networkConfig[chainId].vrfCoordinatorV2
        subscriptionId = networkConfig[chainId].subscriptionId
    }

    const entranceFee = networkConfig[chainId].entranceFee
    const gasLane = networkConfig[chainId].gasLane
    const callBackGasLimit = networkConfig[chainId].callBackGasLimit
    const interval = networkConfig[chainId].interval

    const args = [
        VRFCoordinatorV2Address,
        entranceFee,
        gasLane,
        subscriptionId,
        callBackGasLimit,
        interval,
    ]

    log(`Deploying Raffle contract with account: ${deployer}`)
    const raffle = await deploy('Raffle', {
        from: deployer,
        args: args,
        log: true,
    })

    if (developmentChains.includes(network.name)) {
        const VRFCoordinatorV2MockDeployment = await deployments.get('VRFCoordinatorV2Mock')
        log('Linking VRFCoordinatorV2Mock to Raffle...')

        const VRFCoordinatorV2Mock = await ethers.getContractAt(
            'VRFCoordinatorV2Mock',
            VRFCoordinatorV2MockDeployment.address,
            signer
        )

        await VRFCoordinatorV2Mock.addConsumer(subscriptionId, raffle.address)
    }

    // Verify contract on Etherscan
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log('Verifying contract on Etherscan...')
        await verify(raffle.address, args)
    }

    log('-'.repeat(50))
}

module.exports.tags = ['all', 'raffle']
