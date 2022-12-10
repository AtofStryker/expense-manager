import firebase from 'firebase/app'
import 'firebase/firestore'

const createTags = (uid: string) => [
  {
    name: 'AAA',
    automatic: false,
    id: '83d3aaa6-8012-4504-a538-c47ad43af6e8',
    uid: uid,
  },
  {
    name: 'BBB',
    automatic: false,
    id: '1febaa0c-3857-4ae6-abf2-e30a1970396a',
    uid: uid,
  },
  {
    name: 'CCC',
    automatic: false,
    id: '4144b67d-7aed-4841-b2da-92366778e52b',
    uid: uid,
  },
]

const createTransactions = (uid: string) => [
  {
    id: 'b80e640c-97c5-4e8d-91f5-2bb77ec5a913',
    amount: 16.4,
    transactionType: 'fromUser',
    currency: 'EUR',
    dateTime: firebase.firestore.Timestamp.fromDate(
      new Date('Mon May 20 2020 09:05:18 GMT+0200 (Central European Summer Time)')
    ),
    type: 'expense',
    note: 'A test note',
    tagIds: ['83d3aaa6-8012-4504-a538-c47ad43af6e8', '1febaa0c-3857-4ae6-abf2-e30a1970396a'],
    uid: uid,
    repeating: 'none',
  },
]

export const initializeData = () => {
  cy.task('parseConfiguration').then((config: any) => {
    const uid = config.FIREBASE_TEST_ACCOUNT_UID
    const tags = createTags(uid)
    const transactions = createTransactions(uid)

    tags.forEach((tag) => {
      cy.callFirestore('set', `tags/${tag.id}`, tag)
    })

    transactions.forEach((tx) => {
      cy.callFirestore('set', `transactions/${tx.id}`, tx)
    })
  })
}
