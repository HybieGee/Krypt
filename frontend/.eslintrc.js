module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    // CRITICAL: Prevent localStorage/sessionStorage regressions
    'no-restricted-globals': [
      'error',
      {
        name: 'localStorage',
        message: 'Use safeStorage utility instead of direct localStorage access. Import from @/utils/safeStorage',
      },
      {
        name: 'sessionStorage', 
        message: 'Use safeStorage utility instead of direct sessionStorage access. Import from @/utils/safeStorage',
      },
    ],
    // Prevent problematic patterns
    'no-restricted-syntax': [
      'error',
      {
        selector: "MemberExpression[object.name='window'][property.name='localStorage']",
        message: 'Use safeStorage utility instead of window.localStorage',
      },
      {
        selector: "MemberExpression[object.name='window'][property.name='sessionStorage']",
        message: 'Use safeStorage utility instead of window.sessionStorage',
      },
    ],
  },
  // Allow safeStorage.ts to use localStorage internally
  overrides: [
    {
      files: ['**/safeStorage.ts'],
      rules: {
        'no-restricted-globals': 'off',
        'no-restricted-syntax': 'off',
      },
    },
  ],
}