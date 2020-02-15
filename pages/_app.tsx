import DateFnsUtils from '@date-io/date-fns'
import CssBaseline from '@material-ui/core/CssBaseline'
import { MuiPickersUtilsProvider } from '@material-ui/pickers'
import { ThemeProvider } from '@material-ui/styles'
import App from 'next/app'
import Head from 'next/head'
import Router from 'next/router'
import React, { useEffect } from 'react'
import { Provider as ReduxProvider, useDispatch } from 'react-redux'

import { setCurrentScreen } from '../lib/actions'
import { initializeFirebase } from '../lib/firebase/firebase'
import { configureStore } from '../lib/redux/configureStore'
import { PROJECT_TITLE } from '../lib/shared/constants'
import { ScreenTitle } from '../lib/state'
import theme from '../lib/theme'

const store = configureStore()

const ComponentWithCorrectScreen: React.FC = ({ children }) => {
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
            <MuiPickersUtilsProvider utils={DateFnsUtils}>
              <Head>
                {/* https://github.com/zeit/next.js/blob/master/errors/no-document-title.md */}
                <title>{PROJECT_TITLE}</title>
              </Head>
              <CssBaseline />
              {/* Custom global styles */}
              <style>
                {`
                body {
                  background-color: blanchedalmond !important;
                  /* Disables pull-to-refresh but allows overscroll glow effects. */
                  overscroll-behavior-y: contain;
                }
              `}
              </style>
              <ComponentWithCorrectScreen>
                <Component {...pageProps} />
              </ComponentWithCorrectScreen>
            </MuiPickersUtilsProvider>
          </ThemeProvider>
        </ReduxProvider>
      </React.StrictMode>
    )
  }
}

export default ExpenseManagerApp
