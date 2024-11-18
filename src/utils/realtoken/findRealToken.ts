import { RealToken } from 'src/types/RealToken'
import { CHAIN_ID__GNOSIS_XDAI } from '../blockchain/consts/misc'

export function findRealToken(
  contract: string,
  realtokenList: RealToken[],
  chainId = CHAIN_ID__GNOSIS_XDAI,
) {
  const blockchain = { CHAIN_ID__ETHEREUM: 'ethereum', CHAIN_ID__GNOSIS_XDAI: 'xDai' }[chainId] as
    | 'ethereum'
    | 'xDai'
  return realtokenList.find((item) => {
    const itemContract = item.blockchainAddresses[blockchain]?.contract
    return itemContract && itemContract.toLowerCase() === contract.toLowerCase()
  })
}
