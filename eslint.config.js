const expoConfig = require('eslint-config-expo/flat');
const i18next = require('eslint-plugin-i18next');

module.exports = [
  ...expoConfig,
  // No visible text in components: everything goes through t() (Constitution VI).
  {
    ...i18next.configs['flat/recommended'],
    files: ['app/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}'],
    ignores: ['**/__tests__/**'],
  },
  { ignores: ['dist/*', '.expo/*'] },
];
