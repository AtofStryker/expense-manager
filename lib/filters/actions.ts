import { set } from '@siegrift/tsfunct'
import { getStorage, ref, uploadString } from 'firebase/storage'

import { formatStoragePath, removeFiles } from '../firebase/firestore'
import { Action, Thunk } from '../redux/types'
import { createSuccessNotification, setSnackbarNotification, withErrorHandler } from '../shared/actions'
import { UPLOADING_DATA_ERROR } from '../shared/constants'
import { currentUserIdSel } from '../shared/selectors'
import { Filter, FiltersState } from '../state'

export const uploadFilter =
  (filename: string, code: string): Thunk =>
  async (dispatch, getState) => {
    const userId = currentUserIdSel(getState())

    return withErrorHandler(UPLOADING_DATA_ERROR, dispatch, async () => {
      uploadString(ref(getStorage(), formatStoragePath(userId!, 'filters', filename)), code)
      dispatch(setSnackbarNotification(createSuccessNotification('Filter successfully created')))
    })
  }

export const removeFilters =
  (filenames: string[]): Thunk =>
  async (dispatch, getState) => {
    const userId = currentUserIdSel(getState())

    return withErrorHandler(UPLOADING_DATA_ERROR, dispatch, async () => {
      await Promise.all(
        removeFiles(
          userId!,
          filenames.map((f) => ['filters', f])
        )
      )
      dispatch(setSnackbarNotification(createSuccessNotification('Selected file(s) were successfully removed')))
    })
  }

export const setCurrentFilter = (filter: Filter | undefined): Action<any> => ({
  type: 'Set current filter',
  payload: { filter },
  reducer: (state) => set(state, ['filters', 'current'], filter),
})

export const setFiltersState = (filterState: FiltersState): Action<any> => ({
  type: 'Set filter state',
  payload: { filterState },
  reducer: (state) => set(state, ['filters'], filterState),
})

export const setFiltersError = (error: string): Action<any> => ({
  type: 'Set filter state',
  payload: { error },
  reducer: (state) => set(state, ['filters', 'error'], error),
})
