import '@testing-library/cypress/add-commands'
import 'cypress-plugin-tab'
import './commands'
import { attachCustomCommands } from 'cypress-firebase'
import firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/firestore'
import 'firebase/storage'

before('Initialize firebase and cypress-firebase', () => {
  cy.task('parseConfiguration').then((config: any) => {
    const firebaseConfig = {
      apiKey: config.FIREBASE_PUBLIC_API_KEY,
      authDomain: config.FIREBASE_AUTH_DOMAIN,
      projectId: config.FIREBASE_PROJECT_ID,
      storageBucket: config.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: config.FIREBASE_MESSAGING_SENDER_ID,
      appId: config.FIREBASE_APP_ID,
    }
    firebase.initializeApp(firebaseConfig)

    attachCustomCommands({ Cypress, cy, firebase })
  })
})

beforeEach(() => {
  cy.logout()

  const removeTestData = (coll: string) => {
    cy.callFirestore('get', coll).then((data) => {
      if (!data) return

      cy.task('parseConfiguration').then((config: any) => {
        const uid = config.FIREBASE_TEST_ACCOUNT_UID
        const filtered = data.filter((r: any) => r.uid === uid)
        filtered.forEach((f: any) => {
          cy.callFirestore('delete', `${coll}/${f.id}`)
        })
      })
    })
  }

  removeTestData('transactions')
  removeTestData('tags')
})
