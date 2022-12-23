import { FileObject } from 'mui-file-dropzone'

import { Currency, DEFAULT_CURRENCY } from '../shared/currencies'
import { ObjectOf, FirebaseField } from '../types'

export interface Tag extends FirebaseField {
  name: string
  automatic: boolean
  defaultAmount?: string // can be empty
  isAsset?: boolean // older tags do not have this property defined
}

export enum RepeatingOptions {
  none = 'none',
  inactive = 'inactive',
  daily = 'daily',
  weekly = 'weekly',
  monthly = 'monthly',
  annually = 'annually',
}

export type RepeatingOption = keyof typeof RepeatingOptions

interface BaseTransaction {
  rate?: number
  // NOTE: order might be important
  tagIds: string[]
  currency: Currency
  type: 'income' | 'expense' | 'transfer'
  isExpense?: boolean
  note: string
  repeating: RepeatingOption
}

export interface Transaction extends BaseTransaction, FirebaseField {
  dateTime: Date
  amount: number
  attachedFiles?: string[]
}

export interface AddTransaction extends BaseTransaction {
  newTags: ObjectOf<Tag>
  dateTime: Date | null | undefined
  tagInputValue: string
  amount: string
  shouldValidateAmount: boolean
  attachedFileObjects: FileObject[]
}

type CreateStateProps = {
  initialTagIds: string[]
  initialCurrency: Currency
}

export const createDefaultAddTransactionState = (initialProps?: CreateStateProps): AddTransaction => ({
  amount: '',
  tagIds: initialProps?.initialTagIds || [],
  newTags: {},
  currency: initialProps?.initialCurrency || DEFAULT_CURRENCY,
  tagInputValue: '',
  type: 'expense',
  note: '',
  dateTime: new Date(),
  shouldValidateAmount: false,
  repeating: RepeatingOptions.none,
  attachedFileObjects: [],
})
