import { ProposalState } from '@/shared/types'
import { BuilderInfo, ProposalsToState } from '@/app/collective-rewards/types'

const inactiveProposalsStates = [ProposalState.Canceled, ProposalState.Defeated, ProposalState.Expired]
const isActive = (state: ProposalState) => !inactiveProposalsStates.includes(state)

export const getMostAdvancedProposal = (
  { status, proposals }: BuilderInfo,
  proposalsStateMap: ProposalsToState,
) => {
  return proposals
    .sort(({ timeStamp: a }, { timeStamp: b }) => b - a)
    .find(({ args: { proposalId } }) => {
      const state = proposalsStateMap[proposalId.toString()]

      const isExecuted = ProposalState.Executed === state
      if (status === 'Whitelisted') {
        return isExecuted
      }

      return !isExecuted && isActive(state)
    })
}
