import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp}']
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'logo.png', 'piggy-bank.png', 'banner-avance.png', 'banner-retard.png', 'yellow-coin.png', 'cagnotte-pig.jpg', 'cagnotte-pig-3d.jpg'],
      manifest: {
        name: 'DuoBudget',
        short_name: 'DuoBudget',
        description: 'Vos finances à deux, en toute simplicité.',
        theme_color: '#06b6d4',
        background_color: '#f8fafc',
        display: 'standalone',
        icons: [
          {
            src: 'logo.png',
            sizes: '192x192 512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  define: {
    'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY || '')
  },
})