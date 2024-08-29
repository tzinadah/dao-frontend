import { createContext, ReactNode, useContext, useMemo } from 'react'
import { usePricesContext, withPricesContextProvider } from '@/shared/context/PricesContext'
import { useGetTreasuryBucketBalance } from '@/app/treasury/hooks/useGetTreasuryBucketBalance'
import { treasuryContracts } from '@/lib/contracts'
import { Address } from 'viem'
import { GetPricesResult } from '@/app/user/types'
import { formatCurrency } from '@/lib/utils'

type BucketItem = {
  amount: string
  fiatAmount: string
}

type Bucket = {
  RIF: BucketItem
  RBTC: BucketItem
}

interface TreasuryContextProps {
  buckets: Bucket[]
  bucketsTotal: ReturnType<typeof getAllBucketsHoldings>
}

const getAllBucketsHoldings = (buckets: Bucket[]) => {
  const totalBalance = {
    RIF: 0,
    RBTC: 0,
  }

  buckets.forEach(bucket => {
    totalBalance.RIF += Number(bucket.RIF.amount)
    totalBalance.RBTC += Number(bucket.RBTC.amount)
  })
  return totalBalance
}

const TreasuryContext = createContext<TreasuryContextProps>({
  buckets: [],
  bucketsTotal: { RIF: 0, RBTC: 0 },
})

interface Props {
  children: ReactNode
}

export type TreasurySymbolsSupported = keyof ReturnType<typeof useGetTreasuryBucketBalance>

const getBucketBalance = (
  bucketBalance: ReturnType<typeof useGetTreasuryBucketBalance>,
  prices: GetPricesResult,
) => ({
  RIF: {
    amount: bucketBalance.RIF.balance,
    fiatAmount: formatCurrency(Number(bucketBalance.RIF.balance) * (prices.RIF?.price ?? 0)),
  },
  RBTC: {
    amount: bucketBalance.RBTC.balance,
    fiatAmount: formatCurrency(Number(bucketBalance.RBTC.balance) * (prices.RBTC?.price ?? 0)),
  },
})

const TreasuryContextProvider = ({ children }: Props) => {
  const { prices } = usePricesContext()

  const bucketOneBalance = useGetTreasuryBucketBalance(treasuryContracts?.at(0)?.address as Address)
  const bucketTwoBalance = useGetTreasuryBucketBalance(treasuryContracts?.at(1)?.address as Address)
  const bucketThreeBalance = useGetTreasuryBucketBalance(treasuryContracts?.at(2)?.address as Address)

  const bucketOne: Bucket = useMemo(
    () => getBucketBalance(bucketOneBalance, prices),
    [bucketOneBalance, prices],
  )

  const bucketTwo: Bucket = useMemo(
    () => getBucketBalance(bucketTwoBalance, prices),
    [bucketTwoBalance, prices],
  )

  const bucketThree: Bucket = useMemo(
    () => getBucketBalance(bucketThreeBalance, prices),
    [bucketThreeBalance, prices],
  )

  const bucketsTotal = useMemo(
    () => getAllBucketsHoldings([bucketOne, bucketTwo, bucketThree]),
    [bucketOne, bucketThree, bucketTwo],
  )

  const valueToUse = useMemo(
    () => ({ buckets: [bucketOne, bucketTwo, bucketThree], bucketsTotal }),
    [bucketOne, bucketThree, bucketTwo, bucketsTotal],
  )
  return <TreasuryContext.Provider value={valueToUse}>{children}</TreasuryContext.Provider>
}

export const useTreasuryContext = () => useContext(TreasuryContext)

export const TreasuryContextProviderWithPrices = withPricesContextProvider(TreasuryContextProvider)
