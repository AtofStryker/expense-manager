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
            {/* Enable viewport-fit cover to use all on screen space and enable CSS `env()` function. See: https://developer.mozilla.org/en-US/docs/Web/CSS/env */}
            <meta
              name="viewport"
              content="minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, viewport-fit=cover"
            />
            {/* PWA primary color */}
            <meta name="theme-color" content="#a5790a" />
            {/* Page favicon */}
            <link rel="icon" type="image/png" href="../static/coin.png" />
            {/* Progressive Web App: Match the width of app’s content with width of viewport for mobile devices */}
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            {/* Progressive Web App: Provide manifest file for metadata */}
            <link rel="manifest" href="/static/manifest.json" />
            {/* SEO: App description for search-engine optimization */}
            <meta name="Description" content={PROJECT_DESCRIPTION} />
            {/* Bonus: Have app icon and splash screen for PWAs saved to homescreen on iOS devices */}
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
