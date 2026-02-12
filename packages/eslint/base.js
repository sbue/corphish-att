import js from '@eslint/js'
import globals from 'globals'
import importPlugin from 'eslint-plugin-import'
import turbo from 'eslint-plugin-turbo'
import tseslint from 'typescript-eslint'

export const base = [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      '.next/**',
      '.turbo/**',
      'coverage/**',
      '**/generated/**',
      '*.config.js',
      '*.config.mjs',
      '*.config.ts',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      turbo,
      import: importPlugin,
    },
    rules: {
      'turbo/no-undeclared-env-vars': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      'import/newline-after-import': ['error', { count: 1 }],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../*', '../../*', '../../../*', '../../../../*', '../../../../../*'],
              message: 'Relative imports with ../ are not allowed. Use absolute imports instead.',
            },
          ],
        },
      ],
    },
    settings: {
      'import/resolver': {
        typescript: true,
        node: true,
      },
    },
  },
  {
    files: ['**/*.js', '**/*.mjs'],
    ...tseslint.configs.disableTypeChecked,
  },
]
