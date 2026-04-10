import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@shared': resolve(__dirname, 'src/shared'),
    },
  },
  test: {
    // Default environment; individual test files may override with @vitest-environment
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    typecheck: { tsconfig: './tsconfig.test.json' },
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    environmentOptions: {
      jsdom: { url: 'http://localhost' },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.d.ts', 'src/test-setup.ts'],
    },
  },
})
