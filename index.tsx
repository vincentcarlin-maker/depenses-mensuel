// FIX: Add Vite client types to resolve error on import.meta.env
/// <reference types="vite/client" />

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
    // Utiliser la variable d'environnement de Vite pour le chemin de base est plus robuste.
    const base = import.meta.env.BASE_URL;
    const swUrl = `${base}sw.js`;
    
    navigator.serviceWorker.register(swUrl, { scope: base }).then(registration => {
      console.log('Service Worker registered with scope: ', registration.scope);
    }).catch(registrationError => {
      console.log('Service Worker registration failed: ', registrationError);
    });
  });
}