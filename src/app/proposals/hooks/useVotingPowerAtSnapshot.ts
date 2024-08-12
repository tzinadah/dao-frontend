import { useAccount, useReadContracts } from 'wagmi'
import { GovernorAbi } from '@/lib/abis/Governor'
import { GovernorAddress } from '@/lib/contracts'
import { Address, formatUnits } from 'viem'
import { MULTICALL_ADDRESS } from '@/lib/constants'

/**
 * Snapshot = blockNumber
 * @param blockNumber
 */
export const useVotingPowerAtSnapshot = (blockNumber: bigint) => {
  const { address } = useAccount()
  const { data, isLoading } = useReadContracts({
    allowFailure: false,
    contracts: [
      {
        abi: GovernorAbi,
        address: GovernorAddress,
        functionName: 'getVotes',
        args: [address as Address, blockNumber],
      },
      {
        abi: GovernorAbi,
        address: GovernorAddress,
        functionName: 'proposalThreshold',
      },
    ],
    multicallAddress: MULTICALL_ADDRESS,
  })

  if (isLoading || !data) {
    return {
      votingPowerAtSnapshot: '',
      doesUserHasEnoughThreshold: false,
    }
  }

  const [votingPowerAtSnapshot, threshold] = data

  return {
    votingPowerAtSnapshot: votingPowerAtSnapshot ? formatUnits(votingPowerAtSnapshot, 18) : '',
    doesUserHasEnoughThreshold: votingPowerAtSnapshot >= threshold,
  }
}
