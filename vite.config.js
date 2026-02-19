import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png'],
      manifest: {
        name: "Hunter's Journal — Silksong",
        short_name: "Hunter's Journal",
        description: "Hornet's Hunter's Journal, listing all enemies in Hollow Knight: Silksong",
        theme_color: '#222222',
        background_color: '#222222',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        importScripts: ['/sw-notifications.js'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/vjjm30byfc5nljjh\.public\.blob\.vercel-storage\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'blob-json-cache',
              expiration: { maxEntries: 5, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            urlPattern: /\.(png|jpg|jpeg|webp|gif|svg)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 60 },
            },
          },
        ],
      },
    }),
  ],
})
