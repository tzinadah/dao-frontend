import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    exclude: ['**/__tests__/**/*', '**/node_modules/**/*'],
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
