import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Pour le déploiement sur GitHub Pages, le processus de build de Vite
    // gère automatiquement le chemin de base. Nous devons enregistrer le
    // Service Worker en utilisant un chemin absolu depuis la racine du site.
    // Vite le transformera correctement en /depenses-mensuel/sw.js.
    const swUrl = `/sw.js`; 
    
    // Le scope est essentiel pour que le SW contrôle les bonnes pages.
    const scope = '/depenses-mensuel/';
    
    navigator.serviceWorker.register(swUrl, { scope: scope }).then(registration => {
      console.log('Service Worker registered with scope: ', registration.scope);
    }).catch(registrationError => {
      console.log('Service Worker registration failed: ', registrationError);
    });
  });
}