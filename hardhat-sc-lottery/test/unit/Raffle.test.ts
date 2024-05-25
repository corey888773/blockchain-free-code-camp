import { deployments, ethers, getNamedAccounts, network } from 'hardhat'
import { developmentChains, networkConfig } from '../../helper-hardhat-config'
import { Raffle, VRFCoordinatorV2Mock } from '../../typechain-types'
import { assert, expect } from 'chai'

!developmentChains.includes(network.name)
    ? describe.skip
    : describe('Raffle Unit Test', function () {
          let raffle: Raffle,
              VRFCoordinatorV2Mock: VRFCoordinatorV2Mock,
              chainId: number,
              deployer: string,
              interval: bigint

          this.beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              const signer = await ethers.getSigner(deployer)
              chainId = network.config.chainId!

              await deployments.fixture(['all'])

              const VRFCoordinatorV2MockDeployment = await deployments.get('VRFCoordinatorV2Mock')
              VRFCoordinatorV2Mock = await ethers.getContractAt(
                  'VRFCoordinatorV2Mock',
                  VRFCoordinatorV2MockDeployment.address,
                  signer
              )

              const raffleDeployment = await deployments.get('Raffle')
              raffle = await ethers.getContractAt('Raffle', raffleDeployment.address, signer)
              interval = await raffle.getInterval()
          })

          describe('constructor', function () {
              it('should set the correct values', async function () {
                  const state = await raffle.getRaffleState()
                  const interval = await raffle.getInterval()

                  assert.equal(state.toString(), '0')
                  assert.equal(interval.toString(), networkConfig[chainId].interval)
              })
          })

          describe('enterRaffle', function () {
              it('should revert if the entrance fee is not paid', async function () {
                  await expect(raffle.enterRaffle()).to.be.revertedWithCustomError(
                      raffle,
                      'Raffle__NotEnoughtETHEtnered'
                  )
              })

              it('Should record the players and emit the event', async function () {
                  const entranceFee = networkConfig[chainId].entranceFee
                  await expect(raffle.enterRaffle({ value: entranceFee })).to.emit(
                      raffle,
                      'RaffleEnter'
                  )

                  const player = await raffle.getPlayer(0)
                  assert.equal(player.toString(), deployer)
              })

              it('Should does not allow entrance when raffle is in calculating state', async function () {
                  const entranceFee = networkConfig[chainId].entranceFee
                  await raffle.enterRaffle({ value: entranceFee })

                  await network.provider.send('evm_increaseTime', [Number(interval) + 1])
                  await network.provider.send('evm_mine', [])

                  await raffle.performUpkeep('0x1234')
                  await expect(
                      raffle.enterRaffle({ value: entranceFee })
                  ).to.be.revertedWithCustomError(raffle, 'Raffle__NotOpen')
              })
          })

          describe('checkUpkeep', function () {
              it('Should return false when no funds are sent', async function () {
                  await network.provider.send('evm_increaseTime', [Number(interval) + 1])
                  await network.provider.send('evm_mine', [])

                  const { 0: isUpkeepNeeded, 1: performData } = await raffle.checkUpkeep('0x1234')
                  assert.isFalse(isUpkeepNeeded)
              })

              it('Should return false when raffle is in calculating state', async function () {
                  const entranceFee = networkConfig[chainId].entranceFee
                  await raffle.enterRaffle({ value: entranceFee })

                  await network.provider.send('evm_increaseTime', [Number(interval) + 1])
                  await network.provider.send('evm_mine', [])

                  await raffle.performUpkeep('0x1234')
                  const { 0: isUpkeepNeeded, 1: performData } = await raffle.checkUpkeep('0x1234')
                  assert.isFalse(isUpkeepNeeded)
              })

              it('Should return true when funds are sent, enough time is passed and raffle is open', async function () {
                  const entranceFee = networkConfig[chainId].entranceFee
                  await raffle.enterRaffle({ value: entranceFee })

                  await network.provider.send('evm_increaseTime', [Number(interval) + 1])
                  await network.provider.send('evm_mine', [])

                  const { 0: isUpkeepNeeded, 1: performData } = await raffle.checkUpkeep('0x1234')
                  assert.isTrue(isUpkeepNeeded)
              })
          })

          describe('performUpkeep', function () {
              it('Should run if the upkeep is needed', async function () {
                  const entranceFee = networkConfig[chainId].entranceFee
                  await raffle.enterRaffle({ value: entranceFee })

                  await network.provider.send('evm_increaseTime', [Number(interval) + 1])
                  await network.provider.send('evm_mine', [])

                  const tx = await raffle.performUpkeep('0x1234')
                  assert(tx)
              })

              it('Should revert if the upkeep is not needed', async function () {
                  await expect(raffle.performUpkeep('0x1234')).to.be.revertedWithCustomError(
                      raffle,
                      'Raffle__UpkeepNotNeeded'
                  )
              })

              it('Should emit the event when the upkeep is performed', async function () {
                  const entranceFee = networkConfig[chainId].entranceFee
                  await raffle.enterRaffle({ value: entranceFee })

                  await network.provider.send('evm_increaseTime', [Number(interval) + 1])
                  await network.provider.send('evm_mine', [])

                  expect(await raffle.performUpkeep('0x1234')).to.emit(raffle, 'WinnerPicked')
              })
          })

          describe('fulfillRandomWords', function () {
              this.beforeEach(async function () {
                  raffle.enterRaffle({ value: networkConfig[chainId].entranceFee })
                  await network.provider.send('evm_increaseTime', [Number(interval) + 1])
                  await network.provider.send('evm_mine', [])
              })

              it('can be only call after performUpKeep', async function () {
                  await expect(
                      VRFCoordinatorV2Mock.fulfillRandomWords(0, await raffle.getAddress())
                  ).to.be.revertedWith('nonexistent request')
                  await expect(
                      VRFCoordinatorV2Mock.fulfillRandomWords(1, await raffle.getAddress())
                  ).to.be.revertedWith('nonexistent request')
              })

              it('picks the winner, resets the lottery and sends the money', async function () {
                  const additionalEntrants = 3
                  const startingAccountIndex = 1
                  const accounts = await ethers.getSigners()
                  const raffleEntranceFee = networkConfig[chainId].entranceFee
                  let startingWinnerBalance: bigint

                  for (
                      let i = startingAccountIndex;
                      i < startingAccountIndex + additionalEntrants;
                      i++
                  ) {
                      await raffle.connect(accounts[i]).enterRaffle({ value: raffleEntranceFee })
                  }

                  const startingTimestamp = await raffle.getLastTimeStamp()

                  await new Promise<void>(async (resolve, reject) => {
                      const WinnerPickedEvent = raffle.getEvent('WinnerPicked')
                      raffle.once(WinnerPickedEvent, async () => {
                          console.log('Found the winner')
                          try {
                              const recentWinner = await raffle.getRecentWinner()
                              const raffleState = await raffle.getRaffleState()
                              const endingTimeStamp = await raffle.getLastTimeStamp()
                              const numPlayers = await raffle.getNumberOfPlayers()
                              const endingWinnerBalance = await ethers.provider.getBalance(
                                  recentWinner
                              )
                              assert.equal(numPlayers.toString(), '0')
                              assert.equal(raffleState.toString(), '0')
                              assert(endingTimeStamp > startingTimestamp)
                              assert.equal(
                                  endingWinnerBalance.toString(),
                                  (
                                      startingWinnerBalance +
                                      BigInt(raffleEntranceFee * BigInt(additionalEntrants + 1))
                                  ).toString()
                              )
                              resolve()
                          } catch (err) {
                              reject(err)
                          }
                      })

                      try {
                          const RandomWordsRequestedEvent =
                              VRFCoordinatorV2Mock.getEvent('RandomWordsRequested')
                          const tx = await raffle.performUpkeep('0x1234')
                          await tx.wait()
                          const events = await VRFCoordinatorV2Mock.queryFilter(
                              RandomWordsRequestedEvent
                          )
                          startingWinnerBalance = await ethers.provider.getBalance(
                              accounts[1].address
                          )
                          await VRFCoordinatorV2Mock.fulfillRandomWords(
                              events[0].args[1],
                              await raffle.getAddress()
                          )
                      } catch (err) {
                          reject(err)
                      }
                  })
              })
          })
      })
