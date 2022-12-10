// See: https://nextjs.org/docs/basic-features/typescript#type-checking-nextconfigjs
//
// @ts-check

// By default using NODE_ENV is enough, but there is an option to overwrite it using ENVIRONMENT. The ENVIRONMENT only
// impacts which credentials are loaded and not how applications works.
const getEnvironment = () => process.env.ENVIRONMENT || process.env.NODE_ENV

const parseEnvironmentVariablesAndGetError = () => {
  const environment = getEnvironment()
  switch (environment) {
    case 'development':
      return parseCredentials('.env-dev').error
    // For production env variables see: https://vercel.com/siegrift/expense-manager-pwa/settings/general. They will
    // already be available as env variables by Vercel.
    case 'production':
      return null
    default:
      return new Error(`The environment variable is invalid. It has value: ${environment}`)
  }
}

const parseCredentials = (path) =>
  require('dotenv').config({
    path,
  })

console.info(`Environment: ${getEnvironment()}`)
let error = parseEnvironmentVariablesAndGetError()
if (error) {
  throw new Error(`Unable to parse credentials. Reason: ${error.message}`)
}

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})
const withPwa = require('next-pwa')({
  dest: 'public',
  // Turn off in development. Turn this on for debugging purposes if needeed.
  disable: process.env.NODE_ENV === 'development',
})

const compose = (...fns) =>
  fns.reduce(
    (a, b) =>
      (...args) =>
        a(b(...args)),
    (arg) => arg
  )

/**
 * @type {import('next').NextConfig}
 **/
const nextConfig = {
  // https://nextjs.org/docs/api-reference/next.config.js/environment-variables
  env: {
    FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN ?? '',
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ?? '',
    FIREBASE_PUBLIC_API_KEY: process.env.FIREBASE_PUBLIC_API_KEY ?? '',
    FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET ?? '',
    FIREBASE_APP_ID: process.env.FIREBASE_APP_ID ?? '',
    FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID ?? '',
  },
}

module.exports = compose(withBundleAnalyzer, withPwa)(nextConfig)
