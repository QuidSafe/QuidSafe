import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      'react-native': path.resolve(__dirname, '__tests__/__mocks__/react-native.ts'),
    },
  },
  test: {
    include: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  },
});
