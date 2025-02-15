'use client'
import { useFetchAllProposals } from '@/app/proposals/hooks/useFetchLatestProposals'
import { useGetProposalDeadline } from '@/app/proposals/hooks/useGetProposalDeadline'
import { useGetProposalSnapshot } from '@/app/proposals/hooks/useGetProposalSnapshot'
import { useGetProposalVotes } from '@/app/proposals/hooks/useGetProposalVotes'
import { useVotingPower } from '@/app/proposals/hooks/useVotingPower'
import { useVotingPowerAtSnapshot } from '@/app/proposals/hooks/useVotingPowerAtSnapshot'
import {
  ActionComposerMap,
  ActionInputNameFormatMap,
  FunctionName,
  InputNameFormatMap,
  InputParameterName,
  InputParameterTypeByFnByName,
  InputValueComponent,
  InputValueComposerMap,
  SupportedProposalActionName,
} from '@/app/proposals/shared/supportedABIs'
import { DecodedData, getEventArguments, splitCombinedName } from '@/app/proposals/shared/utils'
import { useAlertContext } from '@/app/providers'
import { formatBalanceToHuman } from '@/app/user/Balances/balanceUtils'
import { useModal } from '@/app/user/Balances/hooks/useModal'
import { AddressOrAlias as AddressComponent } from '@/components/Address'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/Breadcrumb'
import { Button } from '@/components/Button'
import { CopyButton } from '@/components/CopyButton'
import { MainContainer } from '@/components/MainContainer/MainContainer'
import { MetricsCard } from '@/components/MetricsCard'
import { Popover } from '@/components/Popover'
import { Header, Paragraph, Span, Typography } from '@/components/Typography'
import { config } from '@/config'
import { RIF, RIF_ADDRESS } from '@/lib/constants'
import { truncateMiddle } from '@/lib/utils'
import { useExecuteProposal } from '@/shared/hooks/useExecuteProposal'
import { useQueueProposal } from '@/shared/hooks/useQueueProposal'
import { useVoteOnProposal } from '@/shared/hooks/useVoteOnProposal'
import { TX_MESSAGES } from '@/shared/txMessages'
import { waitForTransactionReceipt } from '@wagmi/core'
import { useRouter } from 'next/router'
import { FC, useMemo, useState } from 'react'
import { FaMinus } from 'react-icons/fa6'
import { getAddress } from 'viem'
import { useAccount } from 'wagmi'
import { Vote, VoteProposalModal } from '@/components/Modal/VoteProposalModal'
import { VoteSubmittedModal } from '@/components/Modal/VoteSubmittedModal'
import React from 'react'
import { ProposalState } from '@/shared/types'

export default function ProposalView() {
  const {
    query: { id },
  } = useRouter()
  const { latestProposals } = useFetchAllProposals()

  const proposal = useMemo(() => {
    const proposal = latestProposals.find(proposal => proposal.args.proposalId.toString() === id)
    if (!proposal) {
      return null
    }
    // @ts-ignore
    return getEventArguments(proposal)
  }, [id, latestProposals])

  return <MainContainer>{proposal && <PageWithProposal {...proposal} />}</MainContainer>
}

type ParsedProposal = ReturnType<typeof getEventArguments>

const PageWithProposal = (proposal: ParsedProposal) => {
  const { proposalId, name, description, proposer, Starts } = proposal
  const [vote, setVote] = useState<Vote | null>('for')
  const [errorVoting, setErrorVoting] = useState('')
  const { address } = useAccount()
  const votingModal = useModal()
  const submittedModal = useModal()
  const { setMessage } = useAlertContext()

  const [againstVote, forVote, abstainVote] = useGetProposalVotes(proposalId, true)
  const snapshot = useGetProposalSnapshot(proposalId)

  const { blocksUntilClosure } = useGetProposalDeadline(proposalId)

  const { votingPowerAtSnapshot, doesUserHasEnoughThreshold } = useVotingPowerAtSnapshot(snapshot as bigint)
  const { canCreateProposal } = useVotingPower()

  const { onVote, isProposalActive, didUserVoteAlready, proposalState, proposalStateHuman, isVoting } =
    useVoteOnProposal(proposalId)
  const { onQueueProposal, proposalNeedsQueuing, isQueuing, isTxHashFromQueueLoading } =
    useQueueProposal(proposalId)

  const { onExecuteProposal, canProposalBeExecuted, proposalEtaHumanDate, isExecuting } =
    useExecuteProposal(proposalId)

  const cannotCastVote = !isProposalActive || didUserVoteAlready || !doesUserHasEnoughThreshold || isVoting

  const cannotCastVoteReason = useMemo(() => {
    if (!isProposalActive) {
      return 'This proposal is not active'
    }
    if (didUserVoteAlready) {
      return 'You already voted on this proposal'
    }
    if (!doesUserHasEnoughThreshold) {
      /* eslint-disable quotes */
      return "You don't have enough voting power to vote on this proposal"
    }
    if (isVoting) {
      return 'Your vote is being processed'
    }
    return ''
  }, [isProposalActive, didUserVoteAlready, doesUserHasEnoughThreshold, isVoting])

  const handleVoting = async (vote: Vote) => {
    try {
      setErrorVoting('')
      setMessage(null)
      const txHash = await onVote(vote)
      setMessage(TX_MESSAGES.voting.pending)
      votingModal.closeModal()
      setVote(vote)
      submittedModal.openModal()
      await waitForTransactionReceipt(config, {
        hash: txHash,
      })
      setMessage(TX_MESSAGES.voting.success)
    } catch (err: any) {
      if (err?.cause?.code !== 4001) {
        console.error(err)
        setErrorVoting(err.shortMessage || err.toString())
        setMessage(TX_MESSAGES.voting.error)
      }
    }
  }

  const handleQueuingProposal = async () => {
    try {
      setMessage(null)
      const txHash = await onQueueProposal()
      setMessage(TX_MESSAGES.queuing.pending)
      await waitForTransactionReceipt(config, {
        hash: txHash,
      })
      setMessage(TX_MESSAGES.queuing.success)
    } catch (err: any) {
      if (err?.cause?.code !== 4001) {
        console.error(err)
        setMessage(TX_MESSAGES.queuing.error)
      }
    }
  }

  const handleVotingExecution = async () => {
    try {
      setMessage(null)
      const txHash = await onExecuteProposal()
      if (!txHash) return
      setMessage(TX_MESSAGES.execution.pending)
      await waitForTransactionReceipt(config, {
        hash: txHash,
      })
      setMessage(TX_MESSAGES.execution.success)
    } catch (err: any) {
      if (err?.cause?.code !== 4001) {
        console.error(err)
        setMessage(TX_MESSAGES.execution.error)
      }
    }
  }

  const openModal = () => {
    setErrorVoting('')
    setMessage(null)
    votingModal.openModal()
  }

  const proposalType: SupportedProposalActionName = proposal.calldatasParsed[0]?.functionName

  const { proposalName, builderName } = splitCombinedName(name)

  // @ts-ignore
  return (
    <div className="pl-4 grid grid-rows-1 gap-[32px] mb-[100px]">
      <BreadcrumbSection title={proposalName} />
      <div className="flex items-center justify-between">
        <Header className="text-2xl ">{proposalName}</Header>
        {proposalType === 'whitelistBuilder' && (
          <DewhitelistButton
            proposal={proposal}
            canCreateProposal={canCreateProposal}
            proposalState={proposalState as ProposalState}
          />
        )}
      </div>

      <div className="flex flex-row gap-4 items-baseline">
        <div className="flex flex-row items-baseline gap-1">
          <Paragraph className="text-sm text-gray-500">Proposed by: </Paragraph>
          <Popover
            content={
              <div className="text-[12px] font-bold mb-1">
                <p data-testid="addressTooltip">{proposer}</p>
              </div>
            }
            size="small"
            trigger="hover"
          >
            <CopyButton icon={null} copyText={proposer} className="text-primary font-semibold">
              {builderName || truncateMiddle(proposer, 3, 3)}
            </CopyButton>
          </Popover>
        </div>
        <Paragraph className="text-sm text-gray-500">Created {Starts.fromNow()}</Paragraph>
        <Popover
          content={
            <div className="text-[12px] font-bold mb-1">
              <p data-testid="proposalIDTooltip">{proposalId}</p>
            </div>
          }
          size="small"
          trigger="hover"
        >
          <CopyButton icon={null} copyText={proposalId} className="font-semibold text-primary">
            ID {truncateMiddle(proposalId, 3, 3)}
          </CopyButton>
        </Popover>
        {blocksUntilClosure !== null && proposalState === ProposalState.Active && (
          <Paragraph className="text-sm text-gray-500">
            Blocks until closure: <span className="text-primary">{blocksUntilClosure.toString()}</span>
          </Paragraph>
        )}
      </div>
      <div className="flex flex-row justify-between">
        <div className="flex flex-row gap-x-6">
          <MetricsCard title="Snapshot" amount={snapshot?.toString() || '-'} fiatAmount="Taken at block" />
          <MetricsCard title="State" amount={proposalStateHuman} />
        </div>
        <div>
          {proposalState === ProposalState.Active && (
            <>
              {cannotCastVote ? (
                <Popover
                  content={
                    <div className="text-[12px] font-bold mb-1">
                      <p data-testid="ParagraphCannotCastVote">{cannotCastVoteReason}</p>
                    </div>
                  }
                  size="small"
                  trigger="hover"
                >
                  <Button disabled data-testid="VoteOnChain">
                    Vote on chain
                  </Button>
                </Popover>
              ) : (
                <Button onClick={openModal} data-testid="VoteOnChain">
                  Vote on chain
                </Button>
              )}
            </>
          )}
          {proposalNeedsQueuing && proposalStateHuman === 'Succeeded' && (
            <Button
              onClick={handleQueuingProposal}
              className="mt-2"
              disabled={isQueuing || isTxHashFromQueueLoading}
              loading={isQueuing}
              data-testid="PutOnQueue"
            >
              Put on Queue
            </Button>
          )}
          {proposalState === ProposalState.Queued && (
            <Popover
              size="small"
              trigger="hover"
              content={
                !canProposalBeExecuted ? (
                  <p className="text-[12px] font-bold mb-1">
                    The proposal is not ready to be executed yet. It should be ready on:{' '}
                    {proposalEtaHumanDate}
                  </p>
                ) : isExecuting ? (
                  <p className="text-[12px] font-bold mb-1">The proposal is being executed.</p>
                ) : (
                  <p className="text-[12px] font-bold mb-1">The proposal can be executed.</p>
                )
              }
            >
              <Button
                onClick={handleVotingExecution}
                className="mt-2"
                disabled={!canProposalBeExecuted || isExecuting}
                data-testid="Execute"
              >
                Execute
              </Button>
            </Popover>
          )}
          {isExecuting && <p>Pending transaction confirmation to complete execution.</p>}
          {votingModal.isModalOpened && address && (
            <VoteProposalModal
              onSubmit={handleVoting}
              onClose={votingModal.closeModal}
              proposal={proposal}
              address={address}
              votingPower={votingPowerAtSnapshot}
              isVoting={isVoting}
              errorMessage={errorVoting}
            />
          )}
          {submittedModal.isModalOpened && vote && (
            <VoteSubmittedModal proposal={proposal} vote={vote} onClose={submittedModal.closeModal} />
          )}
        </div>
      </div>
      <div className="flex flex-row gap-x-12">
        <div className="w-2/3">
          <Header variant="h1" className="text-[24px] mb-6">
            Description
          </Header>
          <Paragraph variant="normal" className="text-[16px] text-justify font-light whitespace-pre-wrap">
            {description}
          </Paragraph>
        </div>
        <div className="w-1/3 flex flex-col gap-y-2">
          <Header variant="h1" className="text-[24px]">
            Votes
          </Header>
          <div className="flex flex-row justify-between border border-white border-opacity-40 rounded-lg px-[16px] py-[11px]">
            <Paragraph variant="semibold" className="text-[16px] text-st-success">
              {Math.ceil(Number(forVote)).toString()}
            </Paragraph>
            <Paragraph variant="semibold" className="text-[16px] text-st-success">
              For
            </Paragraph>
          </div>
          <div className="flex flex-row justify-between border border-white border-opacity-40 rounded-lg px-[16px] py-[11px]">
            <Paragraph variant="semibold" className="text-[16px] text-st-error">
              {Math.ceil(Number(againstVote)).toString()}
            </Paragraph>
            <Paragraph variant="semibold" className="text-[16px] text-st-error">
              Against
            </Paragraph>
          </div>
          <div className="flex flex-row justify-between border border-white border-opacity-40 rounded-lg px-[16px] py-[11px]">
            <Paragraph variant="semibold" className="text-[16px] text-text-light">
              {Math.ceil(Number(abstainVote)).toString()}
            </Paragraph>
            <Paragraph variant="semibold" className="text-[16px] text-text-light">
              Abstain
            </Paragraph>
          </div>
          <Header variant="h1" className="text-[24px]">
            Actions
          </Header>
          <div className="border border-white border-opacity-40 rounded-lg px-[16px] py-[11px]">
            <div className="flex flex-col">
              {/*<div className="flex justify-between">*/}
              {/*  <Paragraph variant="semibold" className="text-[16px]">*/}
              {/*    Transfer*/}
              {/*  </Paragraph>*/}
              {/*  <Paragraph variant="normal" className="text-[16px]">*/}
              {/*    {toFixed(formatUnits(0 || 0n, 18))}*/}
              {/*  </Paragraph>*/}
              {/*</div>*/}
              {/*<div className="flex justify-between">*/}
              {/*  <Paragraph variant="semibold" className="text-[16px]">*/}
              {/*    To*/}
              {/*  </Paragraph>*/}
              {/*  <Paragraph variant="normal" className="text-[16px]">*/}
              {/*    {truncateMiddle('123' || '')}*/}
              {/*  </Paragraph>*/}
              {/*</div>*/}
              {/* @ts-ignore */}
              <CalldataRows calldatasParsed={proposal.calldatasParsed} />
            </div>
            <div>
              {/* <Paragraph variant="semibold" className="text-[16px]">
                      {proposal.actions.amount} {proposal.actions.tokenSymbol}
                    </Paragraph>
                    <Paragraph variant="semibold" className="text-[16px]">
                      {shortAddress(proposal.actions.toAddress)}
                    </Paragraph> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const BreadcrumbSection: FC<{ title: string }> = ({ title }) => {
  return (
    <Breadcrumb className="pb-4 border-b">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/proposals">Proposals</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage className="max-w-lg truncate">{title}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}

interface CalldataRowsData {
  calldatasParsed: DecodedData[]
}

const CalldataRows = ({ calldatasParsed }: CalldataRowsData) => {
  return calldatasParsed.map((callData, index) => <CalldataDisplay key={index} {...callData} />)
}

const CalldataDisplay = ({ functionName, args, inputs }: DecodedData) => (
  <div>
    <span className="flex justify-between">
      <Paragraph variant="semibold" className="text-[16px] text-left">
        Function:
      </Paragraph>
      <Span className="font-normal text-left">{functionName}</Span>
    </span>

    <Paragraph variant="semibold" className="text-[16px] mt-2">
      Arguments:
    </Paragraph>
    <ul>
      {inputs.map((input, index) => {
        const inputName = input.name
        const functionInputNames =
          actionInputNameFormatMap[functionName] ||
          ({} as InputNameFormatMap<typeof functionName, typeof inputName>)
        const formattedInputName = (functionInputNames[inputName as never] || inputName) as string

        const inputValue = args[index] as InputParameterTypeByFnByName<typeof functionName, typeof inputName>
        const inputValueComposerMap = (actionComponentMap[functionName] || {}) as InputValueComposerMap<
          typeof functionName,
          typeof inputName
        >
        const InputComponent = inputValueComposerMap[
          inputName as keyof typeof inputValueComposerMap
        ] as InputValueComponent<InputParameterTypeByFnByName<typeof functionName, typeof inputName>>

        return (
          <li key={index} className="my-2 flex justify-between">
            <Typography tagVariant="span" className="font-semibold text-[16px] text-left">
              {formattedInputName}
            </Typography>
            {InputComponent && (
              <InputComponent
                value={inputValue}
                htmlProps={{
                  className: 'font-normal text-right',
                }}
              />
            )}
          </li>
        )
      })}
    </ul>
  </div>
)

type DewhitelistButton = {
  proposal: ParsedProposal
  canCreateProposal: boolean
  proposalState: ProposalState
}

const DewhitelistButton: FC<DewhitelistButton> = ({
  proposal: { calldatasParsed, proposalId },
  canCreateProposal,
  proposalState,
}) => {
  const router = useRouter()
  const rewardDistributorContract = 'SimplifiedRewardDistributorAbi'
  const removeWhitelistedBuilderAction = 'removeWhitelistedBuilder'
  const builderAddress = getAddress(calldatasParsed[0]?.args[0]?.toString() || '')
  const isProposalExecuted = proposalState === ProposalState.Executed
  const isButtonEnabled = builderAddress && isProposalExecuted

  return (
    <>
      {isButtonEnabled && (
        <Button
          startIcon={<FaMinus />}
          onClick={() =>
            router.push(
              `/proposals/create?contract=${rewardDistributorContract}&action=${removeWhitelistedBuilderAction}&builderAddress=${builderAddress}&proposalId=${proposalId}`,
            )
          }
          disabled={!canCreateProposal}
        >
          De-whitelist
        </Button>
      )}
    </>
  )
}

export const actionInputNameFormatMap: Partial<
  ActionInputNameFormatMap<FunctionName[number], InputParameterName>
> = {
  whitelistBuilder: {
    builder_: 'Address to be whitelisted',
    rewardReceiver_: 'Address to receive rewards',
  },
  removeWhitelistedBuilder: {
    builder_: 'Address to be removed',
  },
}

const AddressInputComponent: InputValueComponent<'address'> = ({ value, htmlProps }) => (
  <AddressComponent {...htmlProps} addressOrAlias={value.toString()} />
)

const BigIntInputComponent: InputValueComponent<'bigint'> = ({ value, htmlProps }) => (
  <Span {...(htmlProps as any)}>{formatBalanceToHuman(value)}</Span>
)

const ERC20InputComponent: InputValueComponent<'bigint'> = ({ value, htmlProps }) => (
  <Span {...(htmlProps as any)}>
    {value.toLowerCase() === RIF_ADDRESS.toLowerCase() ? RIF : 'Unknown ERC20'}
  </Span>
)

export const actionComponentMap: Partial<ActionComposerMap> = {
  whitelistBuilder: {
    builder_: AddressInputComponent,
    rewardReceiver_: AddressInputComponent,
  },
  removeWhitelistedBuilder: {
    builder_: AddressInputComponent,
  },
  withdraw: {
    to: AddressInputComponent,
    amount: BigIntInputComponent,
  },
  withdrawERC20: {
    token: ERC20InputComponent,
    to: AddressInputComponent,
    amount: BigIntInputComponent,
  },
}
