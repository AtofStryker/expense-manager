import { AlertColor as NotificationSeverity } from '@mui/material'
import { User } from 'firebase/auth'

import { Tag, Transaction } from './addTransaction/state'
import { Profile } from './profile/state'
import { ObjectOf } from './types'

export type ScreenTitle =
  | 'add'
  | 'transactions'
  | 'assets'
  | 'charts'
  | 'tags'
  | 'profile'
  | 'overview'
  | 'filters'
  | 'filters/create'

export type SignInStatus = 'loggedIn' | 'loggingIn' | 'loggedOut' | 'unknown'

export interface TransactionSearch {
  value: string
  command?: string
  searchQuery?: string
}

/**
 * This is the state that should be saved in backup.
 */
export interface SerializableState {
  tags: ObjectOf<Tag>
  transactions: ObjectOf<Transaction>
  profile: ObjectOf<Profile>
}

export interface NotificationState {
  severity: NotificationSeverity
  message: string
}

export type OverviewPeriod = '7days' | '30days' | 'month' | 'custom'

interface OverviewState {
  period: OverviewPeriod
  customDateRange: [Date | null, Date | null]
  month: number
}

export interface ItemsExpanded {
  [screen: string]: boolean
}

interface NavigationState {
  expanded: ItemsExpanded
}

export interface Filter {
  code: string
  name: string
}

export interface FiltersState {
  error?: string
  available: Filter[]
  current: Filter | undefined
}

export interface State extends SerializableState {
  // use firebase.auth().currentUser to get the current user
  signInStatus: SignInStatus
  currentScreen: ScreenTitle
  transactionSearch: TransactionSearch
  cursor: number
  user: User | null
  notification: NotificationState | null
  confirmDeleteTxForTxId: string | null
  overview: OverviewState
  navigation: NavigationState
  filters?: FiltersState
}

const state: State = {
  signInStatus: 'unknown',
  currentScreen: 'add',
  tags: {},
  transactions: {},
  transactionSearch: {
    value: '',
  },
  cursor: 0,
  user: null,
  notification: null,
  confirmDeleteTxForTxId: null,
  profile: {},
  overview: { period: '7days', month: 0, customDateRange: [null, null] },
  navigation: { expanded: {} },
  filters: undefined,
}

export const getInitialState = () => state
