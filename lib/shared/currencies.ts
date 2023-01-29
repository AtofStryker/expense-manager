import { omit } from '@siegrift/tsfunct'

export const CURRENCIES = {
  AUD: { symbol: '$', scale: 2 },
  CHF: { symbol: 'Fr.', scale: 2 },
  CZK: { symbol: 'Kč', scale: 2 },
  EUR: { symbol: '€', scale: 2 },
  GBP: { symbol: '£', scale: 2 },
  HKD: { symbol: 'HK$', scale: 2 },
  HRK: { symbol: 'kn', scale: 2 },
  HUF: { symbol: 'ft', scale: 2 },
  PLN: { symbol: 'zł', scale: 2 },
  SEK: { symbol: 'kr', scale: 2 },
  USD: { symbol: '$', scale: 2 },
}

export type Currency = keyof typeof CURRENCIES
export type CurrencyValue = (typeof CURRENCIES)['EUR']

export const DEFAULT_CURRENCY: Currency = 'EUR'

export const exchangeRatesUrl = `https://api.exchangeratesapi.io/latest?symbols=${Object.keys(
  omit(CURRENCIES, ['EUR']) // base currency must be excluded
).join(',')}`
