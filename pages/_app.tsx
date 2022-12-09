import React, { useEffect } from 'react'

import CssBaseline from '@material-ui/core/CssBaseline'
import { LocalizationProvider } from '@material-ui/pickers'
import DateFnsUtils from '@material-ui/pickers/adapter/date-fns'
import { ThemeProvider } from '@material-ui/styles'
import App from 'next/app'
import Head from 'next/head'
import Router from 'next/router'
import { Provider as ReduxProvider, useDispatch } from 'react-redux'

import { setCurrentScreen } from '../lib/actions'
import { initializeFirebase } from '../lib/firebase/firebase'
import { configureStore } from '../lib/redux/configureStore'
import { PROJECT_TITLE, BACKGROUND_COLOR, PROJECT_DESCRIPTION } from '../lib/shared/constants'
import { ScreenTitle } from '../lib/state'
import theme from '../lib/theme'

const store = configureStore()

const ComponentWithCorrectScreen = ({ children }) => {
  const dispatch = useDispatch()
  useEffect(() => {
    dispatch(setCurrentScreen(Router.pathname.substring(1) as ScreenTitle))
  })

  return <>{children}</>
}

class ExpenseManagerApp extends App {
  async componentDidMount() {
    return await initializeFirebase(store)
  }

  render() {
    const { Component, pageProps } = this.props

    return (
      <React.StrictMode>
        <ReduxProvider store={store}>
          <ThemeProvider theme={theme}>
            <LocalizationProvider dateAdapter={DateFnsUtils}>
              <Head>
                {/* https://github.com/zeit/next.js/blob/master/errors/no-document-title.md */}
                <title>{PROJECT_TITLE}</title>
                <meta charSet="utf-8" />
                {/* Use minimum-scale=1 to enable GPU rasterization */}
                <meta
                  name="viewport"
                  content="minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no"
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
                {/* Enable material UI typography font */}
                <link
                  rel="stylesheet"
                  href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap"
                />
                {/* https://web.dev/uses-rel-preconnect/?utm_source=lighthouse&utm_medium=node#improve-page-load-speed-with-preconnect */}
                <link rel="preconnect" href="https://api.exchangeratesapi.io"></link>
                <link rel="preconnect" href="https://firebaseremoteconfig.googleapis.com"></link>
                <link rel="preconnect" href="https://firebaseinstallations.googleapis.com"></link>
                {/* React highlight (for showing backups) */}
                <link rel="stylesheet" href="https://highlightjs.org/static/demo/styles/idea.css" />
              </Head>
              <CssBaseline />
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
        </ReduxProvider>
      </React.StrictMode>
    )
  }
}

export default ExpenseManagerApp
