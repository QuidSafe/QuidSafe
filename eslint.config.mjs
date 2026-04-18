import expoConfig from 'eslint-config-expo/flat.js';

export default [
  { ignores: ['dist/**', 'tests/e2e/**', '.claude/**'] },
  ...expoConfig,
];
