import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['app-icon.svg', 'favicon.svg'],
      manifest: {
        name: 'gandalf — speak clearly',
        short_name: 'gandalf',
        description: 'Personalized assistive speech communicator',
        theme_color: '#2563eb',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: 'app-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'app-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
      },
    }),
  ],
});
