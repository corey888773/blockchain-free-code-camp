import { deployments, ethers, getNamedAccounts, network } from 'hardhat'
import { developmentChains, networkConfig } from '../../helper-hardhat-config'
import { Raffle, VRFCoordinatorV2Mock } from '../../typechain-types'
import { assert, expect } from 'chai'
import { WinnerPickedEvent } from '../../typechain-types/contracts/Raffle'

developmentChains.includes(network.name)
    ? describe.skip
    : describe('Raffle Integration Test', function () {
          let raffle: Raffle,
              chainId: number,
              deployer: string,
              interval: bigint,
              raffleEntranceFee: string

          this.beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              const signer = await ethers.getSigner(deployer)
              chainId = network.config.chainId!

              const raffleDeployment = await deployments.get('Raffle')

              raffle = await ethers.getContractAt('Raffle', raffleDeployment.address, signer)
              interval = await raffle.getInterval()
              raffleEntranceFee = (await raffle.getEntranceFee()).toString()
          })

          describe('fulfillRandomWords', function () {
              it('works with Chainlink Automation and VRF, we get a random winner', async function () {
                  console.log('Test start...')

                  const startingTimestamp = await raffle.getLastTimeStamp()
                  let startingWinnerBalance

                  await new Promise<void>(async function (resolve, reject) {
                      const WinnerPickedEvent = raffle.getEvent('WinnerPicked')
                      raffle.once(WinnerPickedEvent, async function () {
                          try {
                              console.log('Winner picked!')
                              const raffleState = await raffle.getRaffleState()
                              const endingTimeStamp = await raffle.getLastTimeStamp()
                              const recentWinner = await raffle.getRecentWinner()
                              const numOfPlayers = await raffle.getNumberOfPlayers()
                              const endingWinnerBalance = await ethers.provider.getBalance(deployer)

                              console.log('Checking the asserts...')

                              assert.equal(raffleState.toString(), '0')
                              assert.equal(numOfPlayers.toString(), '0')
                              assert.equal(recentWinner, deployer)
                              assert(endingTimeStamp > startingTimestamp)
                              assert.equal(
                                  endingWinnerBalance,
                                  startingTimestamp + BigInt(raffleEntranceFee)
                              )
                              resolve()
                          } catch (err) {
                              reject(err)
                          }
                      })

                      try {
                          console.log('Entering raffle...')
                          const tx = await raffle.enterRaffle({ value: raffleEntranceFee })
                          await tx.wait(3)
                          console.log('Entered raffle!')
                          startingWinnerBalance = await ethers.provider.getBalance(deployer)
                          console.log('Starting winner balance: ', startingWinnerBalance.toString())
                      } catch (err) {
                          reject(err)
                      }
                  })
              })
          })
      })
