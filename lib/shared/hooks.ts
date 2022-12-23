import { useState, useEffect } from 'react'

import { useMediaQuery, useTheme } from '@mui/material'
import { useSelector } from 'react-redux'

import { ExchangeRates } from '../profile/state'

import { request } from './request'
import { currentUserIdSel } from './selectors'

export const useIsBigDevice = () => {
  const theme = useTheme()
  return useMediaQuery(theme.breakpoints.up('sm'))
}

export const useIsVeryBigDevice = () => {
  const theme = useTheme()
  return useMediaQuery(theme.breakpoints.up('md'))
}

// inspired by: https://scotch.io/tutorials/create-a-custom-usefetch-react-hook
export const useFetch = (url: string) => {
  const [response, setResponse] = useState<ExchangeRates | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const json = await request<ExchangeRates>(url)
        setResponse(json)
      } catch (error) {
        setError((error as any as Error).message)
      }
    }

    fetchData()
  }, [url])
  return { loading: response === null, error, data: response }
}

export const useFirebaseLoaded = () => {
  const userId = useSelector(currentUserIdSel)
  return userId !== null
}

export const useEffectAfterFirebaseLoaded = (effectCb: () => void) => {
  const loaded = useFirebaseLoaded()
  const [executed, setExecuted] = useState(false)

  useEffect(() => {
    if (!loaded || executed) return
    effectCb()
    setExecuted(true)
  }, [loaded, executed, effectCb])
}

export const useKeyDownAction = (action: (e: KeyboardEvent) => void) => {
  useEffect(() => {
    window.addEventListener('keydown', action)
    return () => {
      window.removeEventListener('keydown', action)
    }
  }, [action])
}
