import { config as reactConfig } from './react-internal.js'

export const nextJsConfig = [
  ...reactConfig,
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@next/next/no-html-link-for-pages': 'off',
      '@typescript-eslint/triple-slash-reference': 'off',
    },
  },
]
