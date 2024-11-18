import { Contract, InterfaceAbi, JsonRpcProvider } from 'ethers'

// import { getErc20AbiBalanceOfOnly } from 'src/utils/blockchain/ERC20'

// import { batchCallOneContractOneFunctionMultipleParams } from './contract'
import { GNO_ContractAddress, HoneySwapFactory_Address, REG_ContractAddress, RWA_ContractAddress, USDConXdai_ContractAddress, WXDAI_ContractAddress } from './consts/otherTokens'
import { CHAIN_ID__ETHEREUM, CHAIN_ID__GNOSIS_XDAI } from './consts/misc'
import { UniswapV2FactoryABI } from './abi/UniswapV2FactoryABI'
import { Interface } from 'ethers/lib.commonjs/abi'
import { batchCallOneFunction } from './contract'
import { getErc20AbiBalanceOfOnly } from 'src/utils/blockchain/ERC20'
// const LP_TYPE_UNIV2 = 2
// const LP_TYPE_UNIV3 = 3

enum LP_TYPES {
  UNIV2 = 2,
  UNIV3,
  BALANCER
}

type T_ABI = Interface | InterfaceAbi

const getFactoryAbi = (lpType: LP_TYPES): T_ABI|null => {
  switch (lpType) {
    case LP_TYPES.UNIV2:
      return UniswapV2FactoryABI
    default:
      console.error('Invalid LP type')
  }
  return null
}

const getFactoryContract = (
  factoryAddress: string,
  provider: JsonRpcProvider,
  lpType: LP_TYPES
): Contract|null => {
  try {
    // const abi = UniswapV2FactoryABI
    const abi = getFactoryAbi(lpType)
    if (!abi) {
      console.error('Invalid ABI')
      return null
    }
    const factoryContract = new Contract(
      factoryAddress,
      // ['function getPair(address,address) public view returns (address)'],
      abi,
      provider
    )
    return factoryContract
  } catch (error) {
    console.error('Failed to get factory contract', error)
  }
  return null
}

const getUniV2PairAddress = async (
  factoryContract: Contract,
  tokenAddress0: string,
  tokenAddress1: string,
): Promise<string> => {
  try {
    const pairAddress = await factoryContract.getPair(
      tokenAddress0,
      tokenAddress1,
    )
    return pairAddress
  } catch (error) {
    console.error(`Failed to get pair address for tokenAddress0: ${tokenAddress0} tokenAddress1: ${tokenAddress1} factoryContract: ${factoryContract?.target}`, error)
  }
  return ''
}

const getUniV2PairAddresses = async (
  factoryContract: Contract,
  arrayOfPairs: string[][],
): Promise<string[]> => {
  const lpAddresses: string[] = []
  try {
    const lpAddressesPromises = arrayOfPairs.map(async (pair) => {
      const pairAddress = await getUniV2PairAddress(
        factoryContract,
        pair[0],
        pair[1]
      )
      // lpAddresses.push(pairAddress)
      return pairAddress
    })
    const lpAddresses = await Promise.all(lpAddressesPromises)
    return lpAddresses
  } catch (error) {
    console.error('Failed to get pair addresses', error)
  }
  return lpAddresses
}


/**
 * 
 * @param tokenAddress : main token of pair
 * @param otherTokensAddresses : other tokens to check for pair againt main token
 * @returns 
 */

const getLpAddresses = async (
  tokenAddress: string,
  // otherTokensAddresses :string[],
  lpType: LP_TYPES,
  provider: JsonRpcProvider,
  chainId: number,
  consoleWarnOnError = false
): Promise<string[]> => {
  const lpAddresses: string[] = []
  try {
    // console.debug(`tokenAddress: ${tokenAddress}`)
    // console.debug(`otherTokensAddresses: ${otherTokensAddresses}`)
    // console.debug(`lpType: ${lpType}`)

    const otherTokensAddresses = getOtherTokensAddresses(tokenAddress, chainId, consoleWarnOnError)
    const arrayOfPairs = getPairs(tokenAddress, otherTokensAddresses)
    console.debug(`getLpAddresses arrayOfPairs:`)
    console.dir(arrayOfPairs)

    if (!arrayOfPairs?.length) {
      consoleWarnOnError && console.error('Empty/Null/Invalid pairs')
      return lpAddresses
    }

    if (chainId === CHAIN_ID__GNOSIS_XDAI) {

      if (lpType === LP_TYPES.UNIV2) {

        // HoneySwap
        const honeySwapContract = getFactoryContract(
          HoneySwapFactory_Address,
          provider,
          lpType
        )
        if (!honeySwapContract) {
          consoleWarnOnError && console.error('Failed to get HoneySwap contract')
          return lpAddresses
        }
        // const arrayOfLpAddressesPromises = arrayOfPairs.map(async (pair) => {
        //   return getUniV2PairAddress(
        //     honeySwapContract,
        //     pair[0],
        //     pair[1]
        //   )
        // })
        // const arrayOfLpAddresses = await Promise.all(arrayOfLpAddressesPromises)
        // return arrayOfLpAddresses
        // return [] // TODO: Implement UNIV2
        const honeySwapPairAddresses = await getUniV2PairAddresses(
          honeySwapContract,
          arrayOfPairs
        )
        // console.debug(`honeySwapPairAddresses:`)
        // console.dir(honeySwapPairAddresses)
        return honeySwapPairAddresses
      }

    }

    if (lpType === LP_TYPES.UNIV3) {
      // TODO
      console.warn('UNIV3 not implemented yet')
      console.warn('UNIV3 not implemented yet')
      console.warn('UNIV3 not implemented yet')
      console.warn('UNIV3 not implemented yet')
      console.warn('UNIV3 not implemented yet')
      console.warn('UNIV3 not implemented yet')
      console.warn('UNIV3 not implemented yet')
      console.warn('UNIV3 not implemented yet')
    }


    return lpAddresses
  } catch (error) {
    console.warn('Failed to get LP addresses', error)
  }
  return lpAddresses
}

// Tokens which may have pairs with REG and RWA

// Array of known tokens addresses on Gnosis chain
// WXDAI, USDConXdai, RWA, REG, GNO
const knownTokensAddresses_Gnosis = [
  WXDAI_ContractAddress,
  USDConXdai_ContractAddress,
  RWA_ContractAddress,
  REG_ContractAddress,
  GNO_ContractAddress
]

const knownTokensAddresses_Ethereum: string[] = [
  // TODO: Add Ethereum addresses
]

/**
 * Returns all known tokens addresses except the one provided
 * @param contractAddress 
 * @param chainId 
 * @param consoleWarnOnError 
 * @returns 
 */
const getOtherTokensAddresses = (
  contractAddress: string,
  chainId: number,
  consoleWarnOnError = false
): string[] => {
  const contractAddresses = [] as string[]
  try {
    const contractADDRESS = contractAddress?.toUpperCase()
    // Default to Gnosis chain
    let knownTokensAddresses;
    switch (chainId) {
      case CHAIN_ID__GNOSIS_XDAI:
        knownTokensAddresses = knownTokensAddresses_Gnosis
        break
      case CHAIN_ID__ETHEREUM:
        knownTokensAddresses = knownTokensAddresses_Ethereum
        break
      default:
        consoleWarnOnError && console.error(`Wrong/Unknown chain: ${chainId}`)
        return []
    }
    if (!contractADDRESS) {
      consoleWarnOnError && console.warn(`Empty/Null contract address`)
      return knownTokensAddresses
    }
    knownTokensAddresses.forEach( address => {
      if (address?.toUpperCase() !== contractADDRESS) {
        contractAddresses.push(address)
      }
    })
    return contractAddresses
  } catch (error) {
    console.warn(`getOtherTokensAddresses: `, error)
  }
  return contractAddresses
}

const getPairs = (
  contractAddress: string,
  otherTokensAddresses: string[]
) : string[][] => {
  try {
    const arrayOfPairs = otherTokensAddresses.map((otherTokenAddress) => {
      return [contractAddress, otherTokenAddress]
    })
    return arrayOfPairs
  } catch (error) {
    console.warn('Failed to get pairs', error)
  }
  return []
}

const getAddressesBalances = async (
  userAddressList: string[],
  erc20Addresses: string[],
  providers: JsonRpcProvider[],
  consoleWarnOnError = false,
): Promise<bigint[][]> => {
  const balances: bigint[][] = []
  try {
    if (!userAddressList?.length) {
      consoleWarnOnError && console.error('Empty/Null/Invalid user address list')
      return balances
    }
    if (!erc20Addresses?.length) {
      consoleWarnOnError && console.error('Empty/Null/Invalid erc20Addresses')
      return balances
    }
    if (!providers?.length) {
      consoleWarnOnError && console.error('Empty/Null/Invalid providers')
      return balances
    }
    const erc20AbiBalanceOfOnly = getErc20AbiBalanceOfOnly()
    if (!erc20AbiBalanceOfOnly) {
      throw new Error('balanceOf ABI not found')
    }
    const erc20Contracts = erc20Addresses.map((erc20Address) => {
      return new Contract(
        erc20Address,
        // ['function balanceOf(address) public view returns (uint256)'],
        erc20AbiBalanceOfOnly,
        providers[0]
      )
    })
    console.debug(`erc20Contracts:`)
    console.dir(erc20Contracts)
    // const balancesPromises = userAddressList.map(async (userAddress) => {
    //   const balances = batchCallOneFunction(
    //     erc20Contracts,
    //     'balanceOf',
    //     userAddress
    //   )
    //   return balances
    // )}
      const userAddressBalancesPromises = userAddressList.map(userAddress => {
        return batchCallOneFunction(
          erc20Contracts,
          'balanceOf',
          [userAddress]
        )
      })

      const userAddressBalances = await Promise.all(userAddressBalancesPromises)
      console.debug(`getAddressesBalances:`)
      console.dir(userAddressBalances)


      // const addressesBalances = await batchCallOneFunction(
      //   erc20Contracts,
      //   'balanceOf',
      //   // userAddressObjects
      //   userAddressList
      // )
      // console.debug(`getAddressesBalances:`)
      // console.dir(addressesBalances)


      // const addressesBalances = await Promise.all(addressesBalancesPromises)
      // return addressesBalances

      // Build a consistent array of balances
      const userAddressBalancesN = userAddressBalances ? userAddressBalances.map((userAddressBalances) => {
        const userBalances = userAddressBalances? userAddressBalances.map((_balance) => {
          // const balance = _balance as bigint
          let balance
          try {
            balance = (_balance ? BigInt(_balance.toString()) : BigInt(0))
          }
          catch (error) {
            // console.warn('Failed to get balance', error)
            balance = BigInt(0)
          }
          return balance
        }) : new Array(erc20Addresses.length).fill(BigInt(0))
        return userBalances
      }) : new Array(userAddressList.length).fill(new Array(erc20Addresses.length).fill(BigInt(0)))

      return userAddressBalancesN

          // const balances = batchCallOneFunction(
    //   erc20Addresses,
    //   'balanceOf',
    //   userAddressList
    // )

  //   const balancesPromises = addressList.map(async (address) => {
  //     const balance = await getErc20AbiBalanceOfOnly(
  //       REG_ContractAddress,
  //       address,
  //       providers[0]
  //     )
  //     return balance
  //   })
  //   const balances = await Promise.all(balancesPromises)
  //   return balances

  } catch (error) {
    consoleWarnOnError && console.warn('Failed to get balances', error)
  }
  return balances
}


const getAddressesLpBalances = async (
  contractAddress: string,
  addressList: string[],
  providers: JsonRpcProvider[],
  consoleWarnOnError = false,
): Promise<number> => {
  const totalAmount = 0
  try {
    console.debug( `addressList: ${addressList}`)
    if (!addressList?.length) {
      consoleWarnOnError && console.error('Empty/Null/Invalid address list')
      return totalAmount
    }
    if (!providers?.length) {
      consoleWarnOnError && console.error('Empty/Null/Invalid providers')
      return totalAmount
    }

    // const otherTokensAddresses = getOtherTokensAddresses(contractAddress, CHAIN_ID__GNOSIS_XDAI, consoleWarnOnError)
    // const arrayOfPairs = getPairs(contractAddress, otherTokensAddresses)
    // console.debug(`arrayOfPairs:`)
    // console.dir(arrayOfPairs)

    // const lpAddresses = getLpAddresses(
    //   contractAddress,

    // )

    const lpAddresses = await getLpAddresses(
      contractAddress,
      LP_TYPES.UNIV2,
      providers[0],
      CHAIN_ID__GNOSIS_XDAI,
      consoleWarnOnError
    )

    console.debug(`getAddressesLpBalances: lpAddresses=`)
    console.dir(lpAddresses)

    const addressesBalances = await getAddressesBalances(
      addressList,
      lpAddresses,
      providers,
      consoleWarnOnError
    )
    console.debug(`getAddressesLpBalances: addressesBalances=`)
    console.dir(addressesBalances)

    return totalAmount
  } catch (error) {
    consoleWarnOnError && console.warn('Failed to get LP balances', error)
  }
  return totalAmount
}

export {
  getFactoryContract,
  getUniV2PairAddress,
  getAddressesLpBalances,
  LP_TYPES
}