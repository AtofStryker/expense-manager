import { set } from '@siegrift/tsfunct'
import { collection, getDocs, getFirestore, limit, query, where, writeBatch } from 'firebase/firestore'

import { uploadToFirebase } from '../actions'
import { Action, Thunk } from '../redux/types'
import {
  createErrorNotification,
  createSuccessNotification,
  setSnackbarNotification,
  withErrorHandler,
} from '../shared/actions'
import { NO_USER_ID_ERROR, UPLOADING_DATA_ERROR } from '../shared/constants'
import { Currency } from '../shared/currencies'
import { currentUserIdSel, profileSel } from '../shared/selectors'
import { downloadFile } from '../shared/utils'
import { State } from '../state'

import {
  dataFromImportedCsvSel,
  dataFromImportedJsonSel,
  csvFromDataSel,
  jsonFromDataSel,
  ImportedData,
} from './importExportSelectors'

const importData =
  (file: File, dataSourceSel: (importData: string, importFileName: string) => (state: State) => ImportedData): Thunk =>
  async (dispatch, getState) => {
    const userId = currentUserIdSel(getState())

    if (!userId) {
      dispatch(setSnackbarNotification(createErrorNotification(NO_USER_ID_ERROR)))
      return Promise.resolve()
    }

    const fileContent = await file.text()
    const { errorReason, tags, transactions, profile } = dataSourceSel(fileContent, file.name)(getState())

    if (errorReason) {
      dispatch(setSnackbarNotification(createErrorNotification(errorReason)))
    } else {
      withErrorHandler(UPLOADING_DATA_ERROR, dispatch, async () => {
        await dispatch(
          uploadToFirebase({
            txs: Object.values(transactions),
            tags: Object.values(tags),
            profile: Object.values(profile),
          })
        )

        dispatch(setSnackbarNotification(createSuccessNotification('Data imported successfully')))
      })
    }
  }

export const importFromCSV =
  (e: React.ChangeEvent<HTMLInputElement>): Thunk =>
  (dispatch, _getState, { logger }) => {
    logger.log('Import from csv')

    return dispatch(importData(e.target.files!.item(0)!, dataFromImportedCsvSel))
  }

export const exportToCSV = (): Action => ({
  type: 'Export to csv',
  reducer: (state) => {
    downloadFile('expense-manager-data.csv', csvFromDataSel(state))
    return state
  },
})

export const clearAllData =
  (): Thunk =>
  async (dispatch, getState, { logger }) => {
    logger.log('Clear all data')

    const userId = currentUserIdSel(getState())
    if (!userId) {
      dispatch(setSnackbarNotification(createErrorNotification(NO_USER_ID_ERROR)))
      return Promise.resolve()
    }

    const removeColl = async (name: string) => {
      let stopRemove = false
      while (!stopRemove) {
        const firestore = getFirestore()
        const batch = writeBatch(firestore)

        // eslint-disable-next-line
        const q = await getDocs(query(collection(firestore, name), where('uid', '==', userId), limit(500)))

        if (q.size > 0) {
          q.docs.forEach((d) => batch.delete(d.ref))
          batch.commit()
        } else {
          stopRemove = true
        }
      }
    }
    return Promise.all([removeColl('transactions'), removeColl('tags'), removeColl('profile')])
  }

export const changeDefaultCurrency =
  (currency: Currency): Thunk =>
  async (dispatch, getState, { logger }) => {
    logger.log('Change default currency')

    withErrorHandler("Couldn't change the default currency", dispatch, () => {
      const profile = profileSel(getState())
      dispatch(
        uploadToFirebase({
          profile: [set(profile, ['settings', 'defaultCurrency'], currency)],
        })
      )
    })
  }

export const changeMainCurrency =
  (currency: Currency): Thunk =>
  async (dispatch, getState, { logger }) => {
    logger.log('Change main currency')

    withErrorHandler("Couldn't change the main currency", dispatch, () => {
      const profile = profileSel(getState())
      dispatch(
        uploadToFirebase({
          profile: [set(profile, ['settings', 'mainCurrency'], currency)],
        })
      )
    })
  }

export const importFromJSON =
  (e: React.ChangeEvent<HTMLInputElement>): Thunk =>
  (dispatch, getState, { logger }) => {
    logger.log('Import from json')

    return dispatch(importData(e.target.files!.item(0)!, dataFromImportedJsonSel))
  }

export const exportToJSON = (): Action => ({
  type: 'Export to csv',
  reducer: (state) => {
    downloadFile('expense-manager-data.json', jsonFromDataSel(state))
    return state
  },
})
