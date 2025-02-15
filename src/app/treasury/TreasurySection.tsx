import { useTreasuryContext } from '@/app/treasury/TreasuryContext'
import { HeaderTitle } from '@/components/Typography'
import { MetricsCard } from '@/components/MetricsCard'
import { toFixed } from '@/lib/utils'
import { treasuryContracts } from '@/lib/contracts'

export const TreasurySection = () => {
  const { buckets } = useTreasuryContext()
  return (
    <div>
      <HeaderTitle className="mb-4">Treasury</HeaderTitle>
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-[24px]">
        {/* RIF Holdings */}
        {treasuryContracts.map((contract, index) => (
          <MetricsCard
            key={`${contract.name}-RIF`}
            title={`${contract.name} RIF`}
            amount={`${buckets[index]?.RIF?.amount ? Math.ceil(Number(buckets[index].RIF.amount)) : 0} RIF`}
            fiatAmount={`= USD ${buckets[index]?.RIF?.fiatAmount ? buckets[index].RIF.fiatAmount : 0}`}
            contractAddress={contract.address}
            data-testid={`${contract.name}-RIF`}
            borderless
          />
        ))}
        {/* RBTC Holdings */}
        {treasuryContracts.map((contract, index) => (
          <MetricsCard
            key={`${contract.name}-RBTC`}
            title={`${contract.name} RBTC`}
            // If the amount is less than 1e-7, show 0, this is because,
            // toFixed may not be correctly formatting it to a clean
            // output due to limitations in JavaScript's handling of floating-point numbers
            amount={`${
              Number(buckets[index]?.RBTC?.amount) < 1e-7 ? 0 : toFixed(Number(buckets[index]?.RBTC?.amount))
            }`}
            fiatAmount={`= USD ${buckets[index]?.RBTC?.fiatAmount ? buckets[index].RBTC.fiatAmount : 0}`}
            data-testid={`${contract.name}-RBTC`}
            borderless
          />
        ))}
      </div>
    </div>
  )
}
