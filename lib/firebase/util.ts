// Initially we used signInWithRedirect, but it doesn't work on Firefox, Safari and Iphone. See:
// https://github.com/firebase/firebase-js-sdk/issues/6716 (issue describing the problem)
// https://firebase.google.com/docs/auth/web/redirect-best-practices (official firebase recommendations)
// https://github.com/firebase/firebase-js-sdk/issues/6443#issuecomment-1187798276 (other workarounds)
//
// In particular, I was tempted to use a workaround described in:
// https://github.com/firebase/firebase-js-sdk/issues/6716#issuecomment-1331981547 But it turns out that it doesn't work
// on localhost.
//

import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword as signInWithEmailAndPasswordFirebase,
} from 'firebase/auth'
import { Timestamp } from 'firebase/firestore'

// At the end I've decided to use signInWithPopup, which works on all browsers, but does not work on mobile.
export async function signIn() {
  const provider = new GoogleAuthProvider()
  await signInWithPopup(getAuth(), provider)
}

export async function signUpWithEmailAndPassword(email: string, password: string) {
  return createUserWithEmailAndPassword(getAuth(), email, password)
}

export async function signInWithEmailAndPassword(email: string, password: string) {
  return signInWithEmailAndPasswordFirebase(getAuth(), email, password)
}

export const convertTimestampsToDates = (value: any): any => {
  if (value instanceof Timestamp) {
    return value.toDate()
  } else if (Array.isArray(value)) {
    return value.map((v) => convertTimestampsToDates(v))
  } else if (typeof value === 'object') {
    return Object.keys(value).reduce((acc, key) => ({ ...acc, [key]: convertTimestampsToDates(value[key]) }), {})
  } else {
    return value
  }
}
