import getConfig from 'next/config'

import { createAction, createReducer } from '@reduxjs/toolkit'

import { t } from 'i18next'

import { UserRepository } from 'src/repositories/user.repository'
import { AppDispatch } from 'src/store/store'
import { Currency } from 'src/types/Currencies'
import { RentCalculation } from 'src/types/RentCalculation'

const USER_LS_KEY = 'store:settings/user'
const USER_CURRENCY_LS_KEY = 'store:settings/userCurrency'
const USER_RENT_CALCULATION_LS_KEY = 'store:settings/userRentCalculation'

export interface User {
  id: string
  mainAddress: string
  addressList: string[]
  whitelistAttributeKeys: string[]
}

interface SettingsInitialStateType {
  user?: User
  userCurrency: Currency
  isInitialized: boolean
  rentCalculation: RentCalculation
  version?: string
}

const settingsInitialState: SettingsInitialStateType = {
  user: undefined,
  userCurrency: Currency.USD,
  rentCalculation: RentCalculation.Global,
  isInitialized: false,
}

// DISPATCH TYPE
export const initializeSettingsDispatchType = 'settings/initialize'
export const userChangedDispatchType = 'settings/userChanged'
export const userCurrencyChangedDispatchType = 'settings/userCurrencyChanged'
export const userRentCalculationChangedDispatchType =
  'settings/userRentCalculationChanged'

// ACTIONS
export const initializeSettings = createAction(initializeSettingsDispatchType)
export const userChanged = createAction<User>(userChangedDispatchType)
export const userCurrencyChanged = createAction<Currency>(
  userCurrencyChangedDispatchType
)
export const userRentCalculationChanged = createAction<RentCalculation>(
  userRentCalculationChangedDispatchType
)

// THUNKS
export function setUserAddress(address: string) {
  return async (dispatch: AppDispatch) => {
    if (!address) {
      dispatch({
        type: userChangedDispatchType,
        payload: undefined,
      })
      return undefined
    }
    try {
      const userId = await UserRepository.getUserId(address)
      if (!userId) {
        throw new Error(t('errors.userNotFound'))
      }
      const user = await UserRepository.getUserDetails(userId)
      dispatch({
        type: userChangedDispatchType,
        payload: {
          mainAddress: address.toLowerCase(),
          ...user,
        },
      })
    } catch (error) {
      console.log(error)
    }
  }
}

export const settingsReducers = createReducer(
  settingsInitialState,
  (builder) => {
    builder
      .addCase(userChanged, (state, action) => {
        state.user = action.payload
        action.payload
          ? localStorage.setItem(USER_LS_KEY, JSON.stringify(action.payload))
          : localStorage.removeItem(USER_LS_KEY)
      })
      .addCase(userCurrencyChanged, (state, action) => {
        state.userCurrency = action.payload
        localStorage.setItem(USER_CURRENCY_LS_KEY, action.payload)
      })
      .addCase(userRentCalculationChanged, (state, action) => {
        state.rentCalculation = action.payload
        localStorage.setItem(USER_RENT_CALCULATION_LS_KEY, action.payload)
      })
      .addCase(initializeSettings, (state) => {
        const user = localStorage.getItem(USER_LS_KEY)
        const userCurrency = localStorage.getItem(USER_CURRENCY_LS_KEY)
        const userRentCalculation = localStorage.getItem(
          USER_RENT_CALCULATION_LS_KEY
        )
        state.user = user ? JSON.parse(user) : undefined
        state.userCurrency = userCurrency
          ? (userCurrency as Currency)
          : Currency.USD
        state.rentCalculation = userRentCalculation
          ? (userRentCalculation as RentCalculation)
          : RentCalculation.Global
        const { publicRuntimeConfig } = getConfig() as {
          publicRuntimeConfig?: { version: string }
        }
        const version = publicRuntimeConfig?.version ?? ''
        localStorage.setItem('lastVersionUsed', version)
        state.version = version

        state.isInitialized = true
      })
  }
)
