import expoConfig from 'eslint-config-expo/flat.js';

export default [
  { ignores: ['dist/**'] },
  ...expoConfig,
];
