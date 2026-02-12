import { config } from '@corphish/eslint/react-internal'

export default [
  ...config,
  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.lint.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      'jsx-a11y/heading-has-content': 'off',
    },
  },
]
