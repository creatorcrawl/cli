import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  clean: true,
  sourcemap: false,
  target: 'node18',
  outDir: 'dist',
  banner: { js: '#!/usr/bin/env node' },
})
