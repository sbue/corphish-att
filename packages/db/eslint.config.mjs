import { base } from '@corphish/eslint/base'

export default [
  ...base,
  {
    ignores: ['src/generated/**'],
  },
  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
]
