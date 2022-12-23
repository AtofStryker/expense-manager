import { getFirebase } from '../lib/firebase/firebase'

async function signOut() {
  // Sign out of Firebase
  await getFirebase().auth().signOut()
}

const Logout = () => {
  return (
    <div>
      <button onClick={signOut} aria-label="sign out">
        google sign out
      </button>
    </div>
  )
}

export default Logout
