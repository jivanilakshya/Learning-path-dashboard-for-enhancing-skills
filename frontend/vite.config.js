import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'https://shiksharthee.onrender.com',
        changeOrigin: true,
        secure: true,
        ws: true
      }
    }
  },
  plugins: [react()],
})
