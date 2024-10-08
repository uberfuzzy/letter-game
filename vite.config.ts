import { defineConfig } from 'vite'
import { resolve } from 'path'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: "/letter-game/",
  plugins: [react()],
  "build": {
    "rollupOptions": {
      "input": {
        main: resolve(__dirname, 'index.html')
      },
    },
  }
})
