import { User } from 'firebase/auth'

import { DEFAULT_CURRENCY, Currency } from '../shared/currencies'
import { FirebaseField } from '../types'

export interface Settings {
  /**
   * All of the transactions will save the rate of the currency of a transaction at the time when the transaction was
   * saved. This rate is computed against the `mainCurrency`. This means that changing the main
   * currency implies changing the rate of all transactions.
   */
  mainCurrency: Currency
  defaultCurrency: Currency
}
export interface ExchangeRates {
  rates: { [key in Currency]: number }
  base: Currency
  date: string
}

export interface Profile extends FirebaseField {
  settings: Settings
  exchangeRates: ExchangeRates
}

export const getInitialState = (user: User): Profile => ({
  uid: user.uid,
  id: user.uid,
  settings: {
    mainCurrency: DEFAULT_CURRENCY,
    defaultCurrency: DEFAULT_CURRENCY,
  },
  exchangeRates: {
    rates: {
      EUR: 1,
      CHF: 1.0784,
      HKD: 9.0882,
      SEK: 10.2958,
      USD: 1.1726,
      GBP: 0.90013,
      HUF: 345.72,
      CZK: 26.319,
      AUD: 1.6508,
      HRK: 7.4755,
      PLN: 4.4201,
    },
    base: 'EUR',
    date: '2020-08-03',
  },
})
