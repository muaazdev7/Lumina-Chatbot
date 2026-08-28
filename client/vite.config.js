import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),
            tailwindcss(),
  ],
  server: {
    // Pinned so the dev origin always matches the server's CLIENT_URL
    // allowlist. strictPort makes a busy port fail loudly instead of
    // silently moving to 5174, which CORS would then reject.
    port: 5173,
    strictPort: true,
  },
})
