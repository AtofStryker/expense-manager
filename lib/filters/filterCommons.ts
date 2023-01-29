import { getStorage, listAll, ref } from 'firebase/storage'

import { firestoreFileContent, formatStoragePath } from '../firebase/firestore'
import { REQUEST_TIMEOUT_ERROR } from '../shared/constants'
import { delay } from '../shared/utils'

export const listFiltersForUser = (userId: string) => {
  const storageRef = ref(getStorage(), formatStoragePath(userId, 'filters'))
  const listFilesPromise = listAll(storageRef).then((res) => res.items.map((itemRef) => itemRef.name))

  return Promise.all([
    Promise.race([listFilesPromise, delay(5 * 1000)]), // max wait time is 5s
    delay(1000), // min wait time is 1s
  ]).then((data) => {
    if (data[0]) {
      return data[0] as string[]
    } else {
      return REQUEST_TIMEOUT_ERROR
    }
  })
}

export const filterFileContent = async (userId: string, filename: string) =>
  firestoreFileContent(userId, ['filters', filename])

export const FILTER_TEMPLATE = `/**
 * Implement arbitrary filter logic in this function. You recieve all
 * expense manager data (readonly) as an object passed in the first
 * parameter. The objects consists of the following fileds:
 * 1) transactions (array)
 * 2) tags (array)
 * 3) profile (object)
 * 
 * The returned state should match the shape of the expense manager data
 * passed as an argument. The code must be synchronous.
 * 
 * WARNING: There are no heavy implemented when running the filters, 
 * meaning that it is possible wrong implementation of a filter will
 * cause the app to crash. Be careful!
 * 
 * Developer choices and tips:
 * 1)   No library functions available - Passing built in functions like
 *      lodash or date-fns would increase the bundle size, as they would
 *      need to be included in all of screens (as filters are feature
 *      across all screens) 
 * 2)   Code must be synchronous - Async code would complicate this feature
 *      even more.
 * 3)   Use console.log and devtools to debug
 * 4)   You can run the code on current data and see the (serialized) 
 *      output below the editor. If there is an error, you will see the 
 *      serialized error.
 */
const filterFunction = (data) => {
 const {
     transactions,
     tags,
     profile
 } = data

 return {
     ...data,
     // copy is necessary, because data is readonly and 'sort' is mutable
     transactions: [...transactions].sort((a, b) => b.amount - a.amount)
 }
}

// The filter function is evalulated using 'eval' and expense manager
// expects a callable function as a result. As eval returns the evaluated
// expression (e.g. eval("1+2") = 3), the function name is an expression
// that will be returned after calling 'eval'.
filterFunction
`
