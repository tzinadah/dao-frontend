import { HeaderTitle } from '@/components/Typography'
import { CycleMetrics } from '@/app/collective-rewards/metrics/CycleMetrics'
import { WhitelistedBuildersLengthMetrics } from '@/app/collective-rewards/metrics/WhitelistedBuildersLengthMetrics'
import { WithBuilderButton } from '@/app/collective-rewards/WithBuilderButton'

const HeaderWithBuilderButton = WithBuilderButton(HeaderTitle)

export const MetricsSection = () => {
  return (
    <div>
      <HeaderWithBuilderButton>Metrics</HeaderWithBuilderButton>
      <div className="grid grid-cols-4 gap-[8px]">
        <CycleMetrics />
        <WhitelistedBuildersLengthMetrics />
      </div>
    </div>
  )
}
