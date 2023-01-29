import { set } from '@siegrift/tsfunct'
import addDays from 'date-fns/addDays'
import addMonths from 'date-fns/addMonths'
import addWeeks from 'date-fns/addWeeks'
import addYears from 'date-fns/addYears'
import isBefore from 'date-fns/isBefore'
import { collection, writeBatch, doc, CollectionReference, getFirestore } from 'firebase/firestore'
import chunk from 'lodash/chunk'
import { v4 as uuid } from 'uuid'

import { Tag, Transaction } from './addTransaction/state'
import { Profile } from './profile/state'
import { Action, Thunk } from './redux/types'
import { createErrorNotification, setSnackbarNotification } from './shared/actions'
import { USER_DATA_NOT_LOADED_ERROR } from './shared/constants'
import { exchangeRatesSel, mainCurrencySel } from './shared/selectors'
import { computeExchangeRate } from './shared/utils'
import { ScreenTitle } from './state'
import { FirebaseField, ObjectOf } from './types'

type CollectionType = 'tags' | 'transactions' | 'profile'
type FirebaseCollections = { [key in CollectionType]: CollectionReference }
type UploadEntry<C extends CollectionType, T extends FirebaseField> = {
  coll: C
  data: T
}
type RemoveEntry<C extends CollectionType> = {
  coll: C
  docId: string
}

export const setCurrentScreen = (screen: ScreenTitle): Action<ScreenTitle> => ({
  type: 'Set current screen',
  payload: screen,
  reducer: (state) => set(state, ['currentScreen'], screen),
})

// Firebase transactions and batch writes are limited to 500 operations per batch.
// Read more in: https://firebase.google.com/docs/firestore/manage-data/transactions
const MAX_WRITES_IN_BATCH = 500

const privateUpload = (
  entries: Array<UploadEntry<'tags', Tag> | UploadEntry<'transactions', Transaction> | UploadEntry<'profile', Profile>>
) => {
  const firestore = getFirestore()
  const collections: FirebaseCollections = {
    tags: collection(firestore, 'tags'),
    transactions: collection(firestore, 'transactions'),
    profile: collection(firestore, 'profile'),
  }

  return chunk(entries, MAX_WRITES_IN_BATCH).map((ch) => {
    const batch = writeBatch(firestore)
    ch.forEach(({ data, coll }) => {
      const ref = doc(collections[coll], data.id)
      batch.set(ref, data)
    })

    return batch.commit()
  })
}

const privateRemove = (entries: Array<RemoveEntry<'tags'> | RemoveEntry<'transactions'>>) => {
  const firestore = getFirestore()
  const collections: FirebaseCollections = {
    tags: collection(firestore, 'tags'),
    transactions: collection(firestore, 'transactions'),
    profile: collection(firestore, 'profile'),
  }

  return chunk(entries, MAX_WRITES_IN_BATCH).map((ch) => {
    const batch = writeBatch(firestore)
    ch.forEach(({ coll, docId }) => {
      const ref = doc(collections[coll], docId)
      batch.delete(ref)
    })

    return batch.commit()
  })
}

interface UploadToFirebaseParams extends Partial<ObjectOf<FirebaseField[]>> {
  txs?: Transaction[]
  tags?: Tag[]
  profile?: Profile[]
}

export const uploadToFirebase =
  (data: UploadToFirebaseParams): Thunk =>
  (dispatch, getState, { logger }) => {
    logger.log('Upload data to firestore', data)

    const { txs, tags, profile } = data
    const uploadEntries: Parameters<typeof privateUpload>[0] = []
    if (tags) {
      uploadEntries.push(...tags.map((t) => ({ coll: 'tags', data: t, docId: t.id } as const)))
    }
    if (txs) {
      uploadEntries.push(
        ...txs.map(
          (t) =>
            ({
              coll: 'transactions',
              data: t,
              docId: t.id,
            } as const)
        )
      )
    }
    if (profile) {
      uploadEntries.push(
        ...Object.keys(profile).map(
          (key) =>
            ({
              coll: 'profile',
              data: profile[key],
              docId: key,
            } as const)
        )
      )
    }

    // NOTE: do not wait for this promise because it will never resolve when offline
    // see: https://www.youtube.com/watch?v=XrltP8bOHT0&feature=youtu.be&t=673
    privateUpload(uploadEntries)
    return Promise.resolve()
  }

export const removeFromFirebase =
  (txIds: string[], tagIds: string[]): Thunk =>
  (dispatch, getState, { logger }) => {
    logger.log('Remove transactions and tags from firestone')
    // NOTE: do not wait for this promise because it will never resolve when offline
    // see: https://www.youtube.com/watch?v=XrltP8bOHT0&feature=youtu.be&t=673
    privateRemove([
      ...tagIds.map(
        (id): RemoveEntry<'tags'> => ({
          coll: 'tags',
          docId: id,
        })
      ),
      ...txIds.map(
        (id): RemoveEntry<'transactions'> => ({
          coll: 'transactions',
          docId: id,
        })
      ),
    ])
    return Promise.resolve()
  }

const setRepeatingTxsAsInactive = (inactive: Transaction[]) => {
  const firestore = getFirestore()
  const txs = collection(firestore, 'transactions')

  return chunk(inactive, MAX_WRITES_IN_BATCH).map((c) => {
    const batch = writeBatch(firestore)
    c.forEach((tx) => {
      const ref = doc(txs, tx.id)
      batch.update(ref, { repeating: 'inactive' } as Partial<Transaction>)
    })

    return batch.commit()
  })
}

export const addRepeatingTxs =
  (): Thunk =>
  async (dispatch, getState, { logger }) => {
    logger.log('Add repeating transactions')

    const exchangeRates = exchangeRatesSel(getState())
    const mainCurrency = mainCurrencySel(getState())

    if (exchangeRates === undefined || mainCurrency === undefined) {
      dispatch(setSnackbarNotification(createErrorNotification(USER_DATA_NOT_LOADED_ERROR)))
      return
    }

    const added: Transaction[] = []
    const inactive: Transaction[] = []
    const now = new Date()

    Object.values(getState().transactions).forEach((tx) => {
      const repeatTx = (stepFn: typeof addYears) => {
        let i = 1
        let lastActiveCreatedTx: Transaction | null = null

        while (true) {
          const newDate = stepFn(tx.dateTime, i)
          if (isBefore(newDate, now)) {
            const newTx: Transaction = {
              ...tx,
              id: uuid(),
              dateTime: newDate,
              // some fields should be updated
              attachedFiles: [],
              rate: computeExchangeRate(exchangeRates.rates, tx.currency, mainCurrency),
            }

            added.push(newTx)
            if (lastActiveCreatedTx === null) {
              inactive.push(tx)
            } else {
              lastActiveCreatedTx.repeating = 'inactive'
            }
            lastActiveCreatedTx = newTx
            i++
          } else {
            break
          }
        }
      }

      switch (tx.repeating) {
        case 'inactive':
        case 'none':
          return
        case 'annually':
          repeatTx(addYears)
          return
        case 'monthly':
          repeatTx(addMonths)
          return
        case 'weekly':
          repeatTx(addWeeks)
        case 'daily':
          repeatTx(addDays)
          return
        default:
          throw new Error(`Unknown repeating mode ${tx.repeating}`)
      }
    })

    await dispatch(uploadToFirebase({ txs: added }))
    setRepeatingTxsAsInactive(inactive)
  }
