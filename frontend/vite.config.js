import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  },
  css: {
    devSourcemap: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@mui/x-date-pickers': path.resolve(__dirname, 'node_modules/@mui/x-date-pickers'),
      'date-fns': path.resolve(__dirname, 'node_modules/date-fns')
    }
  }
})