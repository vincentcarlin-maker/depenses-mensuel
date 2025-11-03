import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Définir le chemin de base pour le déploiement sur GitHub Pages.
  // Cela garantit que les chemins vers les ressources (JS, CSS, images) sont corrects.
  base: '/depenses-mensuel/',
})