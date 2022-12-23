import { useEffect } from 'react'

import { set } from '@siegrift/tsfunct'
import { useDispatch, useSelector } from 'react-redux'

import { uploadToFirebase } from '../../actions'
import { Profile } from '../../profile/state'
import { createErrorNotification, setSnackbarNotification } from '../actions'
import { exchangeRatesUrl } from '../currencies'
import { useFetch } from '../hooks'
import { currentUserIdSel, profileSel } from '../selectors'

export const useRefreshExchangeRates = () => {
  const fetchData = useFetch(exchangeRatesUrl)
  const dispatch = useDispatch()
  const firebaseLoaded = useSelector(currentUserIdSel) !== null
  const profile = useSelector(profileSel)

  useEffect(() => {
    if (!firebaseLoaded) return

    if (fetchData.data) {
      dispatch(
        uploadToFirebase({
          profile: [
            {
              ...profile,
              // TODO: tsfix (unknown ts error)
              exchangeRates: set(fetchData.data as any, ['rates', 'EUR'], 1),
            } as Profile,
          ],
        })
      )
    } else if (fetchData.error) {
      dispatch(setSnackbarNotification(createErrorNotification(fetchData.error)))
    }
  }, [firebaseLoaded, fetchData.data, fetchData.error, dispatch, profile])

  return fetchData
}
