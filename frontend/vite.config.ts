import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  server: {
    allowedHosts: ["saedam.kalee.land"],
    proxy: {
      '/api': {
        target: 'http://saedam-backend:3000',
        changeOrigin: true,
        timeout: 60000, // 60초
      }
    }
  }
})
