import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: './test/setup.ts',
    testTimeout: 30000,
    hookTimeout: 60000,
    exclude: [...configDefaults.exclude, 'dist/**'],
  },
})
