import { deleteObject, getDownloadURL, getStorage, ref } from 'firebase/storage'

import { downloadFile, downloadTextFromUrl } from '../shared/utils'

export const firestoreFileContent = async (userId: string, path: string[]) => {
  const storageRef = ref(getStorage(), formatStoragePath(userId, ...path))
  return downloadTextFromUrl(await getDownloadURL(storageRef))
}

export const downloadFiles = (userId: string, paths: string[][]) => {
  const storage = getStorage()
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  paths.forEach(async (path) => {
    const storageRef = ref(storage, formatStoragePath(userId, 'backup', ...path))
    const text = await downloadTextFromUrl(await getDownloadURL(storageRef))
    downloadFile(path[path.length - 1], text)
  })
}

export const removeFiles = (userId: string, paths: string[][]) => {
  const storage = getStorage()
  return paths.map((path) => deleteObject(ref(storage, formatStoragePath(userId, ...path))))
}

export const formatStoragePath = (...path: string[]) => {
  return path.join('/')
}
