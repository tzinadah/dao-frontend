import { Button } from '@/components/Button'
import { Chip } from '@/components/Chip/Chip'
import { MainContainer } from '@/components/MainContainer/MainContainer'
import { Paragraph, Span, Typography } from '@/components/Typography'
import { cn, truncateMiddle } from '@/lib/utils'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { ReactNode, useState, useEffect, useRef } from 'react'
import { BsTwitterX } from 'react-icons/bs'
import { FaDiscord, FaLink } from 'react-icons/fa'
import { Address, formatEther } from 'viem'
import { useAccount } from 'wagmi'
import { useCommunity } from '@/shared/hooks/useCommunity'
import { useStRif } from '@/shared/hooks/useStRIf'
import { CopyButton } from '@/components/CopyButton'
import { NftHoldersSection } from '@/app/communities/NftHoldersSection'

/**
 * Name of the local storage variable with information about whether the token was added to the wallet
 */
const IS_IN_WALLET = 'isInWallet'
/**
 * Type representing localStorage and state variable for tracking if an NFT token is added to the wallet
 * The structure of the variable is the following:
 * ```json
 * {
 *   "0x123456...123456": {
 *     1: true,
 *     2: true
 *   }
 * }
 * ```
 */
type IsInWallet = Record<Address, Record<number, boolean>>

interface MessageProps {
  text: ReactNode
  severity?: 'info' | 'warning' | 'error'
}

/**
 * Early Adopter community page
 */
export default function Page() {
  const router = useRouter()
  const nftAddress = router.query.address as Address | undefined
  const { address, isConnected } = useAccount()
  const {
    tokensAvailable,
    isMember,
    tokenId,
    membersCount,
    nftName,
    nftSymbol,
    mint: { onMintNFT, isPending: isClaiming },
    nftMeta,
    stRifThreshold,
  } = useCommunity(nftAddress)
  const { stRifBalance } = useStRif()

  const [message, setMessage] = useState<MessageProps | null>(null)
  // reset message after few seconds
  useEffect(() => {
    if (!message) return
    const timeout = setTimeout(() => setMessage(null), 15000)
    return () => clearTimeout(timeout)
  }, [message])
  // read from local storage if the NFT was added to the wallet
  const [isNftInWallet, setIsNftInWallet] = useState<IsInWallet>(() => {
    // prevent from server execution
    if (typeof window !== 'undefined') {
      const storedValue = window.localStorage.getItem(IS_IN_WALLET)
      return storedValue !== null ? JSON.parse(storedValue) : {}
    } else {
      return {}
    }
  })

  // synchronize local storage variable
  useEffect(() => {
    // prevent from server execution
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(IS_IN_WALLET, JSON.stringify(isNftInWallet))
    }
  }, [isNftInWallet])

  const handleMinting = () => {
    if (!address) return
    // check if user's stRIF Balance is more than required threshold to get a reward NFT
    if (stRifBalance < (stRifThreshold ?? 0n))
      return setMessage({
        text: (
          <>
            To get the Early Adopters community NFT you need to own at least ${formatEther(stRifThreshold!)}{' '}
            stRIFs.{' '}
            <span
              className="underline cursor-pointer"
              onClick={() => router.push('/user?action=stake')}
              data-testid="stakeRifLink"
            >
              Stake RIF tokens now.
            </span>
          </>
        ),
        severity: 'warning',
      })

    onMintNFT()
      .then(txHash => {
        setMessage({
          text: 'Request transaction sent. Your claim is in process. It will be visible when the transaction is confirmed.',
        })
      })
      .catch(err => {
        if (err.cause.name !== 'UserRejectedRequestError') {
          console.error('ERROR', err)
          setMessage({
            text: 'Error claiming reward. An unexpected error occurred while trying to claim your reward. Please try again later. If the issue persists, contact support for assistance.',
            severity: 'error',
          })
        }
      })
  }

  // is NFT currently being added to wallet
  const [isAddedToWallet, setIsAddedToWallet] = useState(false)
  // counts how many time `addToWallet` was called before throwing the final error
  const attemptCount = useRef(0)
  // reset variables responsible for adding-to-wallet UX effects
  const resetAddToWallet = () => {
    setIsAddedToWallet(false)
    attemptCount.current = 0
  }
  /**
   * Adds NFT to wallet collection
   */
  const addToWallet = async () => {
    setIsAddedToWallet(true)
    try {
      if (typeof window === 'undefined' || !window.ethereum) throw new Error('Wallet is not installed')
      if (!nftAddress || !tokenId) throw new Error('Unknown NFT')
      if (!isConnected) throw new Error('Provider is not connected')
      let wasAdded = false
      try {
        wasAdded = await window.ethereum.request({
          method: 'wallet_watchAsset',
          params: {
            type: 'ERC721',
            options: {
              address: nftAddress,
              symbol: nftSymbol,
              image: nftMeta?.image,
              tokenId: String(tokenId),
            },
          },
        })
      } catch (error) {
        /*
        Calling the function again after a short timeout if specific error was thrown.
        This is done because the NFT is not recognized by the wallet within the first few seconds after minting
        */
        if ((error as { message?: string })?.message?.includes('Unable to verify ownership')) {
          if (attemptCount.current < 10) {
            attemptCount.current += 1
            return setTimeout(addToWallet, 3000)
          }
          throw new Error('Unable to verify NFT ownership')
        }
        // rethrowing if the error was different
        throw error
      }
      if (!wasAdded) throw new Error('Unable to add NFT to wallet')
      setIsNftInWallet(old => ({ ...old, [nftAddress]: { ...old[nftAddress], [tokenId]: true } }))
      setMessage({ text: `NFT#${tokenId} was added to wallet` })
      resetAddToWallet()
    } catch (error) {
      // don't show error message if user has closed the wallet prompt
      if ((error as { message?: string }).message?.includes('User rejected the request'))
        return resetAddToWallet()
      console.error('ERROR', error)
      setMessage({ text: `Error adding NFT#${tokenId} to wallet`, severity: 'error' })
      resetAddToWallet()
    }
  }

  if (!nftAddress) return null
  return (
    <MainContainer notProtected>
      {message && (
        <div
          data-testid="alertMessage"
          className={cn(
            'bg-opacity-10 border text-st-white rounded-md p-4 mb-4',
            message?.severity === 'error'
              ? 'bg-st-error border-st-error'
              : message?.severity === 'warning'
                ? 'bg-st-info border-st-info text-black'
                : 'bg-st-success border-st-success',
          )}
        >
          {message.text}
        </div>
      )}
      <div className="flex flex-col xl:flex-row justify-between pl-4 gap-8">
        {/* 50%: NFT INFO*/}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-xl overflow-hidden">
              <Image src="/images/ea-nft-dog.png" width={50} height={50} alt="Early Adopters" />
            </div>
            <div className="font-semibold">Early Adopters</div>
          </div>
          <div className="mb-[24px] font-extralight">
            <p className="mb-4">
              The Early Adopters collection features a vibrant array of digital pioneers, each uniquely
              crafted to embody the spirit of innovation and community in the blockchain world. From
              governance and protocol architects to visionary explorers and collaborative creators, these NFTs
              represent the diverse talents and passions driving the decentralized revolution.
            </p>
            <p className="mb-4">
              Whether blazing new trails as blockchain pioneers, nurturing the ecosystem as open-source
              champions, or guiding the community as decentralized thinkers, each character in this collection
              is a testament to the boundless creativity and dedication of those building the future of
              Bitcoin and beyond.
            </p>
            <p>
              Join the journey with these extraordinary individuals as they carve out a new digital frontier,
              one block at a time.
            </p>
          </div>
          {/* Hidden until we get social media data */}
          <div className="flex gap-[8px] mt-[16px] mb-[24px] hidden">
            {/* Chips with community links */}
            <Chip className="bg-white text-black">
              <BsTwitterX />
              <span>X</span>
            </Chip>
            <Chip className="bg-[rgba(74,102,247,1)] text-white">
              <FaDiscord />
              <span>Discord</span>
            </Chip>
            <Chip className="bg-primary text-white">
              <FaLink />
              <span>Website</span>
            </Chip>
          </div>
          {/* pioneer, holders, followers */}
          <div>
            <DivWithBorderTop
              firstParagraph={`${nftName ?? ''} NFT`}
              secondParagraph={
                <CopyButton copyText={nftAddress as string}>
                  {truncateMiddle(nftAddress as string, 4, 4)}
                </CopyButton>
              }
            />
            <DivWithBorderTop firstParagraph="Holders" secondParagraph={membersCount} />
          </div>
        </div>
        {/* 50%: NFT Image and Membership*/}
        <div className="flex-1">
          <div>
            <Span className="mb-6 font-bold inline-block">Membership NFT</Span>
            <div className="flex gap-6">
              <Image
                alt={nftMeta?.name ?? 'Early Adopters NFT'}
                src={nftMeta?.image || '/images/ea-nft-cover.png'}
                className="w-full self-center max-w-56 rounded-md"
                width={500}
                height={500}
              />
              {isMember && tokenId ? (
                <div>
                  <Paragraph variant="semibold" className="text-[18px]">
                    Early Adopter #{tokenId}
                  </Paragraph>

                  {/* `Owned by 0x00000` colored with 2 colors */}
                  <div className="my-[16px] font-light">
                    <Typography tagVariant="span">Owned{address && ' by '}</Typography>
                    {address && (
                      <Typography tagVariant="span" className="text-primary">
                        {truncateMiddle(address, 4, 3)}
                      </Typography>
                    )}
                  </div>

                  {/* `Add to wallet button` */}
                  {!isNftInWallet?.[nftAddress]?.[tokenId] && (
                    <Button
                      onClick={addToWallet}
                      className="mb-4"
                      disabled={isAddedToWallet}
                      loading={isAddedToWallet}
                    >
                      Add to wallet
                    </Button>
                  )}

                  <Span className="inline-block text-[14px] tracking-wide font-light">
                    {nftMeta?.description}
                  </Span>
                </div>
              ) : (
                <div>
                  <Paragraph className="text-[18px]">Early Adopter</Paragraph>
                  <Button
                    variant="primary"
                    className="my-[16px]"
                    onClick={handleMinting}
                    disabled={!tokensAvailable || !address || isClaiming}
                    loading={isClaiming}
                    data-testid="claimButton"
                  >
                    Claim it!
                  </Button>
                  <Span className="inline-block text-[14px] tracking-wide hidden">
                    Crypto ipsum bitcoin ethereum dogecoin litecoin. Hedera USD kadena chainlink weave hive
                    binance. Shiba-inu terra ICON IOTA ICON livepeer velas uniswap. Kadena kusama IOTA
                    horizen.
                  </Span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Holders list */}
      <NftHoldersSection address={nftAddress} />
    </MainContainer>
  )
}

interface DivWithBorderTopProps {
  firstParagraph: ReactNode
  secondParagraph: ReactNode
}

function DivWithBorderTop({ firstParagraph, secondParagraph }: DivWithBorderTopProps) {
  return (
    <div className="flex justify-between py-[24px] border-t-2 border-t-[rgba(255,255,255,0.4)]">
      {/* Avoid wrapping react element with a paragraph  */}
      {typeof firstParagraph === 'object' ? firstParagraph : <Paragraph>{firstParagraph}</Paragraph>}
      {typeof secondParagraph === 'object' ? secondParagraph : <Paragraph>{secondParagraph}</Paragraph>}
    </div>
  )
}
