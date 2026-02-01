import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mkcert from 'vite-plugin-mkcert'
import tailwindcss from '@tailwindcss/vite'


export default defineConfig({
  plugins: [
    react(),
    mkcert(), tailwindcss()
  ],
  server: {
    https: true,
    host: '0.0.0.0', // This allows access from your local network
    port: 5173
  }
})
