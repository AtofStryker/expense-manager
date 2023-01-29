import { getAuth } from 'firebase/auth'

async function signOut() {
  await getAuth().signOut()
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
