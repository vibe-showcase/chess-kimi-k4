import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: '/chess-kimi-k4/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
})
