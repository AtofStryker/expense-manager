import { set } from '@siegrift/tsfunct'
import { deleteObject, getStorage, ref, uploadBytesResumable } from 'firebase/storage'
import { difference } from 'lodash'
import Router from 'next/router'

import { removeFromFirebase, uploadToFirebase } from '../actions'
import { Transaction, Tag } from '../addTransaction/state'
import { formatStoragePath } from '../firebase/firestore'
import { Action, Thunk } from '../redux/types'
import { createSuccessNotification, setSnackbarNotification, withErrorHandler } from '../shared/actions'
import { currentUserIdSel } from '../shared/selectors'
import { TransactionSearch } from '../state'
import { ObjectOf } from '../types'

import { applySearchOnTransactions } from './selectors'

export const saveTxEdit =
  (newTags: ObjectOf<Tag>, newFiles: File[], editedFields: Omit<Transaction, 'uid'>): Thunk =>
  async (dispatch, getState, { logger }) => {
    logger.log('Save edited transaction', { newFiles, newTags, editedFields })

    const userId = currentUserIdSel(getState())!
    const originalTx = getState().transactions[editedFields.id]
    // TODO: what to do with tags that are not in any expense (deleted by edit)
    const tx: Transaction = { ...originalTx, ...editedFields }
    tx.attachedFiles = (tx.attachedFiles ?? []).concat(newFiles.map((f) => f.name))
    const storageRef = ref(getStorage(), formatStoragePath(userId, 'files', originalTx.id))
    let success: boolean | undefined

    // remove user selected uploaded files from storage
    success = await withErrorHandler('Failed to remove attached files', dispatch, async () => {
      const toRemove = difference(originalTx.attachedFiles, editedFields.attachedFiles!)

      const promises = toRemove.map((filename) => {
        const fileToRemove = ref(storageRef, filename)
        deleteObject(fileToRemove)
      })
      await Promise.all(promises)
      return true
    })

    // upload files chosen by the user
    if (success) {
      success = await withErrorHandler('Failed to upload new attached files', dispatch, async () => {
        const fileUploads = newFiles.map(async (file) =>
          // TODO: handle duplicate filenames
          uploadBytesResumable(ref(storageRef, file.name), file)
        )
        await Promise.all(fileUploads)
        return true
      })
    }

    if (success) {
      success = await withErrorHandler('Failed to upload edited transaction', dispatch, async () => {
        await dispatch(uploadToFirebase({ txs: [tx], tags: Object.values(newTags) }))
        return true
      })
    }

    if (success) {
      dispatch(setSnackbarNotification(createSuccessNotification('Transaction edit successful')))
    }
  }

export const removeTx =
  (txId: string): Thunk =>
  async (dispatch, getState, { logger }) => {
    logger.log('Remove transaction')

    const userId = currentUserIdSel(getState())!
    const tx = getState().transactions[txId]
    const storageRef = ref(getStorage(), formatStoragePath(userId, 'files', txId))

    let success = await withErrorHandler('Failed to remove attached files', dispatch, async () => {
      const promises = tx.attachedFiles?.map((filename) => {
        return deleteObject(ref(storageRef, filename))
      })

      await Promise.all(promises ?? [])
      return true
    })

    if (success) {
      success = await withErrorHandler('Failed to remove transaction data', dispatch, async () => {
        // TODO: what to do with tags that are not in any expense (deleted by edit)
        await dispatch(removeFromFirebase([txId], []))
        return true
      })
    }

    if (success) {
      dispatch(setSnackbarNotification(createSuccessNotification('Transaction successfully removed')))
    }
  }

export const changeTxSearchQuery = (query: TransactionSearch): Action<TransactionSearch> => ({
  type: 'Change search query',
  payload: query,
  reducer: (state) => set(state, ['transactionSearch'], query),
})

export const setCursor = (newCursor: number): Action<number> => ({
  type: 'Set cursor',
  payload: newCursor,
  reducer: (state) => set(state, ['cursor'], newCursor),
})

export const setConfirmTxDeleteDialogOpen = (txId: string | null): Action => ({
  type: `${txId ? 'Open' : 'Close'} confirm delete tx dialog`,
  reducer: (state) => set(state, ['confirmDeleteTxForTxId'], txId),
})

export const keyPressAction =
  (e: KeyboardEvent): Thunk<void> =>
  (dispatch, getState, { logger }) => {
    const key = e.key.toUpperCase()
    const cursor = getState().cursor
    const txs = applySearchOnTransactions(getState())
    if (!txs[cursor]) return

    const actions = {
      ARROWUP: async () => {
        if (cursor > 0) {
          await Router.replace(`/transactions`, `/transactions#${txs[cursor - 1].id}`)
        }
      },
      ARROWDOWN: async () => {
        if (cursor + 1 < txs.length) {
          await Router.replace(`/transactions`, `/transactions#${txs[cursor + 1].id}`)
        }
      },
      E: () => Router.push(`/transactions/details?id=${txs[cursor].id}`),
      D: () => dispatch(setConfirmTxDeleteDialogOpen(txs[cursor].id)),
    }

    if (!actions.hasOwnProperty(key)) return

    // only log this if the keypress is actionable to reduce spam
    logger.log('Transaction list action for key: ' + key)

    // trigger the action
    return actions[key]()
  }
