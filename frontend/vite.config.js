import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Dev mirror of frontend/nginx.conf: with VITE_API_BASE_URL empty, the SPA hits
// same-origin /api & /ws and Vite proxies each prefix to the local service port.
const api = (target) => ({ target, changeOrigin: true })

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/auth': api('http://localhost:8081'),
      '/api/groups': api('http://localhost:8081'),
      '/api/friends': api('http://localhost:8081'),
      '/api/challenges': api('http://localhost:8082'),
      '/api/categories': api('http://localhost:8082'),
      '/api/submissions': api('http://localhost:8083'),
      '/api/leaderboard': api('http://localhost:8087'),
      '/api/notifications': api('http://localhost:8090'),
      '/api/metrics': api('http://localhost:8089'),
      '/ws/notifications': { target: 'ws://localhost:8090', ws: true },
    },
  },
})
