import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { crx } from '@crxjs/vite-plugin'
import { buildManifest } from './manifest.config.ts'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    plugins: [react(), tailwindcss(), crx({ manifest: buildManifest(env) })],
    build: {
      target: 'esnext',
      // The dev server writes an extension that only works while Vite is
      // running. Keeping it out of dist/ means the build you load unpacked is
      // always the standalone one.
      outDir: command === 'serve' ? 'dist-dev' : 'dist',
    },
  }
})
