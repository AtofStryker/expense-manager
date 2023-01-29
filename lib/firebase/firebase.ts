import { initializeApp, getApp, getApps } from 'firebase/app'
import { getAuth as getAuthFromFirebase } from 'firebase/auth'
import { getFirestore, enableMultiTabIndexedDbPersistence } from 'firebase/firestore'
import { Store } from 'redux'

import { createErrorNotification, setSnackbarNotification } from '../shared/actions'

import { authChangeAction } from './actions'

const firebaseConfig = {
  apiKey: process.env.FIREBASE_PUBLIC_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
}

export const initializeFirebase = async (store: Store) => {
  // firebase can be initialized only once but this is called repeatedly after hot-reload
  // See: https://stackoverflow.com/a/67144062
  if (getApps().length > 0) return getApp()
  const firebaseApp = initializeApp(firebaseConfig)

  // persistance only works in browsers
  if (typeof window !== 'undefined') {
    await enableMultiTabIndexedDbPersistence(getFirestore()).catch((err) => {
      if (err.code === 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled
        // in one tab at a a time.
        store.dispatch(
          setSnackbarNotification(
            createErrorNotification('Expense manager is opened on mutliple tabs. Local persistance is disabled!')
          )
        )
      } else if (err.code === 'unimplemented') {
        // The current browser does not support all of the
        // features required to enable persistence
        store.dispatch(
          setSnackbarNotification(createErrorNotification('Underlying platform (browser) does not support persistance'))
        )
      }
    })
  }

  let persistedUser = getAuthFromFirebase().currentUser
  if (persistedUser) {
    store.dispatch(authChangeAction(persistedUser ? 'loggedIn' : 'loggedOut', persistedUser) as any)
  }

  getAuthFromFirebase().onAuthStateChanged((user) => {
    if (persistedUser) persistedUser = null
    else {
      store.dispatch(authChangeAction(user ? 'loggedIn' : 'loggedOut', user) as any)
    }
  })

  return firebaseApp
}
