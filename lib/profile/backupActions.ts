import { getStorage, ref, uploadString } from 'firebase/storage'

import { formatStoragePath, removeFiles } from '../firebase/firestore'
import { Thunk } from '../redux/types'
import { createSuccessNotification, setSnackbarNotification, withErrorHandler } from '../shared/actions'
import { UPLOADING_DATA_ERROR } from '../shared/constants'
import { currentUserIdSel } from '../shared/selectors'

import { jsonFromDataSel } from './importExportSelectors'

export const uploadBackup =
  (
    filename: string,
    // because we can't use the selector when doing automatic backup
    withUserId?: string
  ): Thunk =>
  async (dispatch, getState) => {
    const userId = withUserId ?? currentUserIdSel(getState())
    const jsonData = jsonFromDataSel(getState())

    withErrorHandler(UPLOADING_DATA_ERROR, dispatch, async () => {
      await uploadString(ref(getStorage(), formatStoragePath(userId!, 'backup', filename)), jsonData)
      dispatch(setSnackbarNotification(createSuccessNotification('Backup successful')))
    })
  }

export const removeBackupFiles =
  (filenames: string[]): Thunk =>
  async (dispatch, getState) => {
    const userId = currentUserIdSel(getState())

    withErrorHandler(UPLOADING_DATA_ERROR, dispatch, async () => {
      await Promise.all(
        removeFiles(
          userId!,
          filenames.map((f) => ['backup', f])
        )
      )
      dispatch(setSnackbarNotification(createSuccessNotification('Selected file(s) were successfully removed')))
    })
  }
