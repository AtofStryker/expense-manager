require('./load-env')
// eslint-disable-next-line
const withOffline = require('next-offline')
// eslint-disable-next-line
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const compose = (...fns) =>
  fns.reduce(
    (a, b) => (...args) => a(b(...args)),
    (arg) => arg,
  )

// https://github.com/hanford/next-offline#now-20
const nextConfig = {
  // https://nextjs.org/docs/api-reference/next.config.js/environment-variables
  env: {
    FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
    FIREBASE_DATABASE_URL: process.env.FIREBASE_DATABASE_URL,
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_PUBLIC_API_KEY: process.env.FIREBASE_PUBLIC_API_KEY,
    FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
    FIREBASE_APP_ID: process.env.FIREBASE_APP_ID,
    FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID,
  },
  transformManifest: (manifest) => ['/'].concat(manifest), // add the homepage to the cache
  // Trying to set NODE_ENV=production when running yarn dev causes a build-time error so we
  // turn on the SW in dev mode so that we can actually test it
  generateInDevMode: false,
  // https://developers.google.com/web/tools/workbox/reference-docs/latest/module-workbox-webpack-plugin.GenerateSW#GenerateSW
  workboxOpts: {
    swDest: 'static/service-worker.js',
    runtimeCaching: [
      {
        urlPattern: /^https?.*/,
        // https://developers.google.com/web/tools/workbox/reference-docs/latest/module-workbox-strategies
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'https-calls',
          expiration: {
            maxEntries: 150,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 1 month
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
    ],
  },
  webpack: (config, { dev }) => {
    config.module.rules.push({
      test: /\.tsx$/,
      exclude: /node_modules/,
      loader: 'eslint-loader',
      options: {
        emitWarning: dev,
      },
    })
    return config
  },
}

module.exports = compose(withBundleAnalyzer, withOffline)(nextConfig)
