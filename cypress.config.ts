import { join } from 'path'

import { defineConfig } from 'cypress'
import { plugin as cypressFirebasePlugin } from 'cypress-firebase'
import dotenv from 'dotenv'
import admin from 'firebase-admin'

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      on('task', {
        // Configuration needs to be loaded inside "plugins" otherwise __dirname doesn't work properly
        parseConfiguration() {
          const path = join(__dirname, '.env-dev')
          const result = dotenv.config({
            path,
          })

          if (result.error) {
            throw new Error(`Unable to parse config file on path: ${path}`)
          }

          return result.parsed!
        },
      })

      cypressFirebasePlugin(on, config, admin)
    },
    baseUrl: 'http://localhost:3000',
    defaultCommandTimeout: 10000,
    retries: {
      runMode: 1,
      openMode: 0,
    },
    video: true,
    projectId: '4qffcg',
    specPattern: 'cypress/e2e/**/*.{js,jsx,ts,tsx}',
  },
})
