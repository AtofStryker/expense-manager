import { join } from 'path'

import createBundler from '@bahmutov/cypress-esbuild-preprocessor'
import { defineConfig } from 'cypress'
import { plugin as cypressFirebasePlugin } from 'cypress-firebase'
import dotenv from 'dotenv'
import admin from 'firebase-admin'

function parseConfiguration() {
  const path = join(__dirname, '.env-dev')
  const result = dotenv.config({
    path,
  })

  if (result.error) {
    throw new Error(`Unable to parse config file on path: ${path}`)
  }

  return result.parsed!
}

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      on('task', {
        parseConfiguration,
      })
      // Needed as a workaround for importing cypress-firebase which uses optional chaining
      // which is not supported by webpack v4 internally used by Cypress.
      //
      // See: https://github.com/prescottprue/cypress-firebase/issues/788#issuecomment-1407622371
      on('file:preprocessor', createBundler())

      const env = parseConfiguration()
      cypressFirebasePlugin(on, config, admin, {
        projectId: env.FIREBASE_PROJECT_ID,
        credential: admin.credential.cert(env.SERVICE_ACCOUNT_PATH),
      })
    },
    baseUrl: 'http://localhost:3000',
    defaultCommandTimeout: 10000,
    retries: {
      runMode: 1,
      openMode: 0,
    },
    video: true,
    projectId: '4qffcg',
    specPattern: 'cypress/e2e/**/*.spec.{js,jsx,ts,tsx}',
  },
})
