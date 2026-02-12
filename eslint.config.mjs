import { base } from '@corphish/eslint/base'

export default [
  ...base,
  {
    ignores: ['apps/**', 'packages/**'],
  },
]
