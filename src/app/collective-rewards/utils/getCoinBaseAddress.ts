import { getAddress, keccak256, toUtf8Bytes, ZeroAddress } from 'ethers'
import { Address } from 'viem'

export const getCoinBaseAddress = () => {
  return getAddress(keccak256(toUtf8Bytes('COINBASE_ADDRESS')).slice(26)) as Address
}

export const resolveCollectiveRewardToken = (rewardToken: Address) =>
  rewardToken === ZeroAddress ? getCoinBaseAddress() : rewardToken
