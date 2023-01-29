import { pick } from '@siegrift/tsfunct'
import { getStorage, ref, uploadBytesResumable } from 'firebase/storage'
import { v4 as uuid } from 'uuid'

import { uploadToFirebase } from '../actions'
import { formatStoragePath } from '../firebase/firestore'
import { Thunk } from '../redux/types'
import {
  createErrorNotification,
  createSuccessNotification,
  setSnackbarNotification,
  withErrorHandler,
} from '../shared/actions'
import { NO_USER_ID_ERROR, UPLOADING_DATA_ERROR, USER_DATA_NOT_LOADED_ERROR } from '../shared/constants'
import { currentUserIdSel, exchangeRatesSel, mainCurrencySel } from '../shared/selectors'
import { computeExchangeRate } from '../shared/utils'

import { AddTransaction, Transaction } from './state'

export const addTransaction =
  (addTx: AddTransaction): Thunk =>
  async (dispatch, getState, { logger }) => {
    logger.log('Add transaction')

    const userId = currentUserIdSel(getState())
    const exchangeRates = exchangeRatesSel(getState())
    const mainCurrency = mainCurrencySel(getState())

    if (!userId) {
      // this shouldn't happen. We optimistically show the user the add tx form
      // and by the time he fills it there should be enough time for firebase to load.
      dispatch(setSnackbarNotification(createErrorNotification(NO_USER_ID_ERROR)))
    } else if (exchangeRates === undefined || mainCurrency === undefined) {
      dispatch(setSnackbarNotification(createErrorNotification(USER_DATA_NOT_LOADED_ERROR)))
    } else {
      const id = uuid()

      const storage = getStorage()
      const fileUploads = addTx.attachedFileObjects.map(async ({ file }) =>
        // TODO: handle duplicate filenames
        uploadBytesResumable(ref(storage, formatStoragePath(userId, 'files', id, file.name)), file)
      )

      const tx: Transaction = {
        id,
        ...pick(addTx, ['tagIds', 'currency', 'type', 'note', 'repeating']),
        dateTime: addTx.dateTime!,
        amount: Number.parseFloat(addTx.amount),
        uid: userId,
        rate: computeExchangeRate(exchangeRates.rates, addTx.currency, mainCurrency),
        attachedFiles: addTx.attachedFileObjects.map(({ file }) => file.name),
      }

      await withErrorHandler(UPLOADING_DATA_ERROR, dispatch, async () => {
        await Promise.all(fileUploads)
        await dispatch(uploadToFirebase({ txs: [tx], tags: Object.values(addTx.newTags) }))
        dispatch(setSnackbarNotification(createSuccessNotification('Transaction added successfully')))
      })
    }
  }
