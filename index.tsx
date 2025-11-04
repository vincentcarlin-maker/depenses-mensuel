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
    // Déterminer le chemin de base dynamiquement à partir de l'URL de la page.
    // C'est une méthode robuste qui fonctionne en local et en production sur GitHub Pages.
    const path = window.location.pathname;
    // Assure que le chemin de base se termine par un '/'
    const base = path.substring(0, path.lastIndexOf('/') + 1);
    const swUrl = `${base}sw.js`;
    
    navigator.serviceWorker.register(swUrl, { scope: base }).then(registration => {
      console.log('Service Worker registered with scope: ', registration.scope);
    }).catch(registrationError => {
      console.log('Service Worker registration failed: ', registrationError);
    });
  });
}