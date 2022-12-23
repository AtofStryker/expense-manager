// Initially I wanted us to import everything from @mui/material, because it seemed everything needed from
// @emotion/react is re-exported from @mui/material. This is not true (for example, `SerializedStyles` is not
// re-exported). So I concluded to import everything emotion related from @emotion/react.
//
// However, `styled` needs to be imported from @mui/material, otherwise the theme is not correctly typed. This suggests
// we should import what we can from @mui/material and fallback to @emotion/react if necessary.
//
// Then I encountered a problem during build. Specifically: ./lib/filters/codeEditor.tsx Module parse failed: Identifier
//    '_templateObject' has already been declared (11:9) File was processed with these loaders: *
//    ./node_modules/.pnpm/next@13.0.6_biqbaboplfbrettd7655fr4n2y/node_modules/next/dist/build/webpack/loaders/next-swc-loader.js
//
// After debugging, I found that the problem is caused by importing `css` from @mui/material and when imported from
// @emotion/react the build works. I only enforced importing `styled` because it needs access to the theme.
const getRestrictedImportRulesForStyling = () => {
  return [
    {
      name: '@emotion/react',
      importNames: ['styled'],
      message: "Import it from '@mui/material' instead.",
    },
    {
      name: '@mui/material',
      importNames: ['css', 'keyframes'],
      message: "Import it from '@emotion/react' instead.",
    },
  ]
}

module.exports = {
  env: {
    jest: true,
  },
  extends: [
    './.eslintrc.base.js',
    'plugin:jest/recommended',
    'plugin:jest/style',
    'plugin:jest-formatting/recommended',
  ],
  rules: {
    'react/no-unknown-property': ['error', { ignore: ['css'] }],
    'no-restricted-imports': [
      'error',
      {
        paths: [
          {
            name: 'react',
            importNames: ['default'],
            message:
              "We don't need to import React in every file. Use named imports when a specific React API is needed.",
          },
          ...getRestrictedImportRulesForStyling(),
        ],
      },
    ],
    'react/forbid-component-props': ['error', { forbid: ['style'] }],
    // This rule unfortunately does not detect deprecated properties. See:
    // https://github.com/gund/eslint-plugin-deprecation/issues/13/
    'deprecation/deprecation': 'error',
  },
}
