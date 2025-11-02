import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/depenses-mensuel/', // Spécifier le nom du dépôt pour le déploiement sur GitHub Pages
})