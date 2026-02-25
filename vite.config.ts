import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import webExtension from 'vite-plugin-web-extension'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const targetBrowser = process.env.TARGET_BROWSER || 'chrome'
  const isExtension = process.env.VITE_BUILD_TARGET === 'extension'

  return {
    build: {
      outDir: isExtension ? `dist/${targetBrowser}` : 'dist',
      emptyOutDir: true,
    },
    plugins: [
      vue(),
      isExtension && webExtension({
        manifest: 'src/manifest.json',
        browser: targetBrowser as any,
        // Override manifest for Firefox
        transformManifest(manifest) {
          if (targetBrowser === 'firefox') {
            return {
              ...manifest,
              browser_specific_settings: {
                gecko: {
                  id: 'smart-favorites@vince6799.github.io' // Replace with your actual add-on ID
                }
              }
            }
          }
          return manifest
        }
      })
    ].filter(Boolean),
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        // Use runtime-only vue-i18n build to satisfy Chrome Extension CSP (no eval)
        'vue-i18n': 'vue-i18n/dist/vue-i18n.runtime.esm-bundler.js'
      }
    }
  }
})
