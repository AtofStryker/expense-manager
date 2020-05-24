import React, { useEffect } from 'react'

import Router from 'next/router'

import { getFirebase } from '../lib/firebase/firebase'

async function signOut() {
  // Sign out of Firebase
  await getFirebase().auth().signOut()
}

const Logout = () => {
  useEffect(() => {
    // Prefetch the /login page as the user will go there after the logout
    // see: firebase.ts
    Router.prefetch('/login')
  }, [])

  return (
    <div>
      <button onClick={signOut} aria-label="sign out">
        google sign out
      </button>
    </div>
  )
}

export default Logout