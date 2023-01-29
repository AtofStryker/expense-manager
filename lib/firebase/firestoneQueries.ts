import { omit, set, update } from '@siegrift/tsfunct'
import { getAuth } from 'firebase/auth'
import { getFirestore, Query, QuerySnapshot, collection, query, where } from 'firebase/firestore'
import keyBy from 'lodash/keyBy'
import map from 'lodash/map'

import { State } from '../state'

import { convertTimestampsToDates } from './util'

export type QueryReducer = (state: State, payload: QuerySnapshot) => State

export interface FirestoneQuery {
  type: string
  createFirestoneQuery: () => Query
  essential: boolean
  reducer: QueryReducer
}

const createQueryReducer =
  (stateProp: 'transactions' | 'tags' | 'profile'): QueryReducer =>
  (state, payload) => {
    return update(state, [stateProp], (statePart) => {
      let newStatePart = statePart
      payload.docChanges().forEach((c) => {
        if (c.type === 'removed') {
          newStatePart = omit(newStatePart, [c.doc.id])
        } else if (c.type === 'added') {
          newStatePart = {
            ...newStatePart,
            [c.doc.id]: convertTimestampsToDates(c.doc.data()),
          }
        } else {
          newStatePart = set(newStatePart, [c.doc.id], convertTimestampsToDates(c.doc.data()))
        }
      })
      return newStatePart as any
    })
  }

const allTransactionsQuery: FirestoneQuery = {
  type: 'All transactions query',
  essential: false,
  createFirestoneQuery: () => {
    const firestore = getFirestore()
    const auth = getAuth()

    // TODO: Do we need the where clause
    return query(collection(firestore, 'transactions'), where('uid', '==', auth.currentUser!.uid))
  },
  reducer: (state, payload) => {
    const newState = createQueryReducer('transactions')(state, payload)
    const modifiedTransactions = map(newState.transactions, (transaction) => {
      if (transaction.type) return transaction

      return {
        ...transaction,
        type: !!transaction.isExpense ? 'expense' : 'income',
      } as const
    })
    return {
      ...newState,
      transactions: keyBy(modifiedTransactions, 'id'),
    }
  },
}

const allTags: FirestoneQuery = {
  type: 'All tags query',
  essential: true,
  createFirestoneQuery: () => {
    const firestore = getFirestore()
    const auth = getAuth()

    return query(collection(firestore, 'tags'), where('uid', '==', auth.currentUser!.uid))
  },
  reducer: createQueryReducer('tags'),
}

const profile: FirestoneQuery = {
  type: 'Profile query',
  essential: true,
  createFirestoneQuery: () => {
    const firestore = getFirestore()
    const auth = getAuth()

    return query(collection(firestore, 'profile'), where('uid', '==', auth.currentUser!.uid))
  },
  reducer: createQueryReducer('profile'),
}

export const getQueries = (): FirestoneQuery[] => {
  return [allTransactionsQuery, allTags, profile]
}
