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
    // Déterminer dynamiquement le chemin de base à partir de l'URL de la page,
    // car `import.meta.url` n'est pas fiable dans tous les environnements.
    const path = window.location.pathname;
    // Extrait le chemin du répertoire, en s'assurant qu'il se termine par un slash.
    const scope = path.substring(0, path.lastIndexOf('/') + 1);
    const swUrl = `${scope}sw.js`;
    
    navigator.serviceWorker.register(swUrl, { scope: scope }).then(registration => {
      console.log('Service Worker registered with scope: ', registration.scope);
    }).catch(registrationError => {
      console.log('Service Worker registration failed: ', registrationError);
    });
  });
}