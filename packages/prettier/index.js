const sortImportsPlugin = require.resolve('@ianvs/prettier-plugin-sort-imports')
const tailwindPlugin = require.resolve('prettier-plugin-tailwindcss')

/** @type {import("prettier").Config} */
module.exports = {
  trailingComma: 'all',
  singleQuote: true,
  printWidth: 100,
  tabWidth: 2,
  semi: false,
  arrowParens: 'always',
  bracketSpacing: true,
  endOfLine: 'lf',
  plugins: [sortImportsPlugin, tailwindPlugin],
  importOrder: [
    'react',
    '<BUILTIN_MODULES>',
    '^next(/.+)?$',
    '<THIRD_PARTY_MODULES>',
    '^@corphish/db(/.+)?$',
    '^@corphish/api(/.+)?$',
    '^@corphish(/.+)?$',
    '^@/.*$',
    '^[./]',
  ],
  importOrderParserPlugins: ['typescript', 'jsx', 'decorators-legacy'],
}
