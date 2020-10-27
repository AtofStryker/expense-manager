import { set } from '@siegrift/tsfunct'

import { uploadToFirebase } from '../actions'
import { getFirebase } from '../firebase/firebase'
import { Action, Thunk } from '../redux/types'
import { setAppError, withErrorHandler } from '../shared/actions'
import { NO_USER_ID_ERROR } from '../shared/constants'
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

const importData = (
  file: File,
  dataSourceSel: (importData: string) => (state: State) => ImportedData,
): Thunk => (dispatch, getState) => {
  const userId = currentUserIdSel(getState())
  const reader = new FileReader()

  if (!userId) {
    dispatch(setAppError(NO_USER_ID_ERROR))
    return Promise.resolve()
  }

  return new Promise((res) => {
    reader.onload = async () => {
      const { errorReason, tags, transactions, profile } = dataSourceSel(
        reader.result as string,
      )(getState())

      if (errorReason) {
        dispatch(setAppError(errorReason))
      } else {
        // TODO: display success notification
        await dispatch(
          uploadToFirebase({
            txs: Object.values(transactions),
            tags: Object.values(tags),
            profile: Object.values(profile),
          }),
        )
      }

      res()
    }

    reader.readAsText(file)
  })
}

export const importFromCSV = (
  e: React.ChangeEvent<HTMLInputElement>,
): Thunk => (dispatch, _getState, { logger }) => {
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

export const clearAllData = (): Thunk => async (
  dispatch,
  getState,
  { logger },
) => {
  logger.log('Clear all data')

  const userId = currentUserIdSel(getState())
  if (!userId) {
    dispatch(setAppError(NO_USER_ID_ERROR))
    return Promise.resolve()
  }

  const removeColl = async (name: string) => {
    let stopRemove = false
    while (!stopRemove) {
      const batch = getFirebase().firestore().batch()

      // this is the only way to remove all of the data
      // eslint-disable-next-line
      const q = await getFirebase()
        .firestore()
        .collection(name)
        .where('uid', '==', userId)
        .limit(500)
        .get()

      if (q.size > 0) {
        q.docs.forEach((d) => batch.delete(d.ref))
        batch.commit()
      } else {
        stopRemove = true
      }
    }
  }
  return Promise.all([
    removeColl('transactions'),
    removeColl('tags'),
    removeColl('profile'),
  ])
}

export const changeDefaultCurrency = (currency: Currency): Thunk => async (
  dispatch,
  getState,
  { logger },
) => {
  logger.log('Change default currency')

  withErrorHandler("Couldn't change the default currency", dispatch, () => {
    const profile = profileSel(getState())
    dispatch(
      uploadToFirebase({
        profile: [set(profile, ['settings', 'defaultCurrency'], currency)],
      }),
    )
  })
}

export const changeMainCurrency = (currency: Currency): Thunk => async (
  dispatch,
  getState,
  { logger },
) => {
  logger.log('Change main currency')

  withErrorHandler("Couldn't change the main currency", dispatch, () => {
    const profile = profileSel(getState())
    dispatch(
      uploadToFirebase({
        profile: [set(profile, ['settings', 'mainCurrency'], currency)],
      }),
    )
  })
}

export const importFromJSON = (
  e: React.ChangeEvent<HTMLInputElement>,
): Thunk => (dispatch, getState, { logger }) => {
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
