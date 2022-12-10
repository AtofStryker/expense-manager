const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Must point to the path with "next.config.js".
  dir: './',
})

const baseConfig = {
  clearMocks: true,
  testMatch: ['**/?(*.)+(test).ts?(x)'],
}

/**
 * @type {import('jest').Config}
 */
module.exports = createJestConfig(baseConfig)
