import { StrictMode, useEffect } from 'react'

import { CacheProvider, EmotionCache } from '@emotion/react'
import { CssBaseline } from '@mui/material'
import { ThemeProvider } from '@mui/material/styles'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { AppProps } from 'next/app'
import Head from 'next/head'
import Router from 'next/router'
import { Provider as ReduxProvider, useDispatch } from 'react-redux'

import { setCurrentScreen } from '../lib/actions'
import createEmotionCache from '../lib/createEmotionCache'
import { initializeFirebase } from '../lib/firebase/firebase'
import { configureStore } from '../lib/redux/configureStore'
import { PROJECT_TITLE, BACKGROUND_COLOR, PROJECT_DESCRIPTION } from '../lib/shared/constants'
import { ScreenTitle } from '../lib/state'
import theme from '../lib/theme'

const store = configureStore()

// Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createEmotionCache()

const ComponentWithCorrectScreen = ({ children }) => {
  const dispatch = useDispatch()
  useEffect(() => {
    dispatch(setCurrentScreen(Router.pathname.substring(1) as ScreenTitle))
  })

  return <>{children}</>
}
interface ExpenseManagerAppProps extends AppProps {
  emotionCache?: EmotionCache
}

const ExpenseManagerApp = (props: ExpenseManagerAppProps) => {
  useEffect(() => {
    initializeFirebase(store)
  }, [])

  const { Component, pageProps, emotionCache = clientSideEmotionCache } = props

  return (
    <StrictMode>
      <ReduxProvider store={store}>
        <CacheProvider value={emotionCache}>
          <Head>
            {/* https://github.com/zeit/next.js/blob/master/errors/no-document-title.md */}
            <title>{PROJECT_TITLE}</title>
            <meta charSet="utf-8" />
            {/* Use minimum-scale=1 to enable GPU rasterization */}
            <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no" />

            {/* https://vite-pwa-org.netlify.app/guide/pwa-minimal-requirements.html#icons-images */}
            <link rel="apple-touch-icon" sizes="180x180" href="/static/apple-touch-icon.png" />
            <meta name="theme-color" content="#a5790a" />
            <link rel="icon" type="image/png" href="/static/coin.png" />
            <link rel="manifest" href="/static/manifest.json" />

            {/* SEO: App description for search-engine optimization */}
            <meta name="Description" content={PROJECT_DESCRIPTION} />
            {/* Have app icon and splash screen for PWAs saved to homescreen on iOS devices */}
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-status-bar-style" content="black" />
            {/* https://web.dev/uses-rel-preconnect/?utm_source=lighthouse&utm_medium=node#improve-page-load-speed-with-preconnect */}
            <link rel="preconnect" href="https://api.exchangeratesapi.io"></link>
            <link rel="preconnect" href="https://firebaseremoteconfig.googleapis.com"></link>
            <link rel="preconnect" href="https://firebaseinstallations.googleapis.com"></link>
          </Head>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              {/* Custom global styles */}
              <style>
                {`
                body {
                  background-color: ${BACKGROUND_COLOR} !important;
                  /* Disables pull-to-refresh but allows overscroll glow effects. */
                  overscroll-behavior-y: contain;
                }
              `}
              </style>
              <ComponentWithCorrectScreen>
                <Component {...pageProps} />
              </ComponentWithCorrectScreen>
            </LocalizationProvider>
          </ThemeProvider>
        </CacheProvider>
      </ReduxProvider>
    </StrictMode>
  )
}

export default ExpenseManagerApp
