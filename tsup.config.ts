import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  clean: true,
  sourcemap: false,
  target: 'node18',
  outDir: 'dist',
  noExternal: [/.*/],
  outExtension: () => ({ js: '.cjs' }),
})
