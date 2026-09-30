import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    host: '0.0.0.0', // Allow other devices on the same Wi-Fi to connect
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5959',
        changeOrigin: true
      }
    }
  },
  build: {
    chunkSizeWarningLimit: 1600
  }
})
