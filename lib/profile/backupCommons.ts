import { isBefore, parse, format } from 'date-fns'
import { getStorage, listAll, ref } from 'firebase/storage'

import { downloadFiles, firestoreFileContent, formatStoragePath } from '../firebase/firestore'
import { REQUEST_TIMEOUT_ERROR } from '../shared/constants'
import { delay } from '../shared/utils'

export const AUTO_BACKUP_PERIOD_DAYS = 7
export const BACKUP_FILENAME_FORMAT = 'dd.MM.yyyy - HH:mm:ss'

export const listBackupFilesForUser = async (userId: string) => {
  const listFilesPromise = listAll(ref(getStorage(), formatStoragePath(userId, 'backup'))).then(function (res) {
    return res.items.map((itemRef) => {
      return itemRef.name
    })
  })

  return Promise.all([
    Promise.race([listFilesPromise, delay(5 * 1000)]), // max wait time is 5s
    delay(1000), // min wait time is 1s
  ]).then((data) => {
    if (data[0]) {
      const d = data[0] as string[]
      return d.sort((d1, d2) => {
        const base = new Date()
        const dd1 = parse(d1, BACKUP_FILENAME_FORMAT, base)
        const dd2 = parse(d2, BACKUP_FILENAME_FORMAT, base)
        return isBefore(dd1, dd2) ? 1 : -1
      })
    } else {
      return REQUEST_TIMEOUT_ERROR
    }
  })
}

export const backupFileContent = async (userId: string, filename: string) =>
  firestoreFileContent(userId, ['backup', filename])

export const createBackupFilename = () => format(new Date(), BACKUP_FILENAME_FORMAT)

export const downloadBackupFiles = (userId: string, filenames: string[]) =>
  downloadFiles(
    userId,
    filenames.map((f) => ['backup', f])
  )
