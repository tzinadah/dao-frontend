import { Address } from 'viem'

export const GITHUB_ORG = 'RootstockCollective'
export const ENV = process.env.NEXT_PUBLIC_ENV as string
export const RIF_WALLET_SERVICES_URL = process.env.NEXT_PUBLIC_RIF_WALLET_SERVICES
export const EXPLORER_URL = process.env.NEXT_PUBLIC_EXPLORER
export const BUILD_ID = process.env.NEXT_PUBLIC_BUILD_ID as string

export const RIF_ADDRESS = process.env.NEXT_PUBLIC_RIF_ADDRESS as Address
export const STRIF_ADDRESS = process.env.NEXT_PUBLIC_STRIF_ADDRESS as Address
export const GOVERNOR_ADDRESS = process.env.NEXT_PUBLIC_GOVERNOR_ADDRESS as Address
export const EA_NFT_ADDRESS = process.env.NEXT_PUBLIC_EA_NFT_ADDRESS?.toLowerCase() as Address
export const MULTICALL_ADDRESS = process.env.NEXT_PUBLIC_MULTICALL_ADDRESS as Address
export const GRANTS_BUCKET_ADDRESS = process.env.NEXT_PUBLIC_GRANTS_BUCKET_ADDRESS as Address
export const GRANTS_ACTIVE_BUCKET_ADDRESS = process.env.NEXT_PUBLIC_GRANTS_ACTIVE_BUCKET_ADDRESS as Address
export const GROWTH_BUCKET_ADDRESS = process.env.NEXT_PUBLIC_GROWTH_BUCKET_ADDRESS as Address
export const GENERAL_BUCKET_ADDRESS = process.env.NEXT_PUBLIC_GENERAL_BUCKET_ADDRESS as Address
export const CHAIN_ID = process.env.NEXT_PUBLIC_CHAIN_ID

export const SIMPLIFIED_REWARD_DISTRIBUTOR_ADDRESS = process.env
  .NEXT_PUBLIC_SIMPLIFIED_REWARD_DISTRIBUTOR_ADDRESS as Address
export const CYCLE_DURATION_IN_DAYS = process.env.NEXT_PUBLIC_CYCLE_DURATION_IN_DAYS
export const FIRST_CYCLE_START_DATE_ISO = process.env.NEXT_PUBLIC_FIRST_CYCLE_START_DATE_ISO

export const WHITELISTED_BUILDERS_URL = process.env.NEXT_PUBLIC_WHITELISTED_BUILDERS_URL

export const ADDRESS_ANIMATION_DURATION = 800

export const RIF = 'RIF'
export const USD = 'USD'
export const USD_SYMBOL = '$'
