import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': { target: 'https://focusroom-g3dj.onrender.com', changeOrigin: true },
      '/socket.io': { target: 'https://focusroom-g3dj.onrender.com', ws: true },
    },
    allowedHosts: ['localhost', 'ricotta-coil-magnetize.ngrok-free.dev'],
  },
});
