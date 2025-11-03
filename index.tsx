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
    // Le chemin de base de l'application, tel que défini dans vite.config.ts.
    // Utiliser un chemin absolu et un scope explicite rend l'enregistrement plus fiable.
    const basePath = '/depenses-mensuel/'; 
    const swUrl = `${basePath}sw.js`; 
    
    navigator.serviceWorker.register(swUrl, { scope: basePath }).then(registration => {
      console.log('Service Worker registered with scope: ', registration.scope);
    }).catch(registrationError => {
      console.log('Service Worker registration failed: ', registrationError);
    });
  });
}
