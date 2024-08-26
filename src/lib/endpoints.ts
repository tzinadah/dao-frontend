export const fetchAddressTokensEndpoint = '/address/{{address}}/tokens?chainId={{chainId}}'

export const fetchPricesEndpoint = '/price?addresses={{addresses}}&convert={{convert}}'

export const fetchNFTsOwnedByAddressAndNftAddress = '/address/{{address}}/nfts/{{nftAddress}}'

export const fetchProposalsCreatedByGovernorAddress =
  '/address/{{address}}/eventsByTopic0?topic0=0x7d84a6263ae0d98d3329bd7b46bb4e8d6f98cd35a7adb45c274c8b7fd5ebd5e0'

export const getNftInfo = '/nfts/{{nftAddress}}'
