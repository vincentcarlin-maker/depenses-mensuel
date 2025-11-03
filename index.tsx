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
    // The Vite-specific `import.meta.env.BASE_URL` is not available in the
    // current execution environment, causing a runtime error.
    // We replace it with the hardcoded base path to ensure the service worker
    // registers correctly. This is consistent with other files like sw.js.
    const basePath = '/depenses-mensuel/';
    const swUrl = `${basePath}sw.js`; 
    
    navigator.serviceWorker.register(swUrl, { scope: basePath }).then(registration => {
      console.log('Service Worker registered with scope: ', registration.scope);
    }).catch(registrationError => {
      console.log('Service Worker registration failed: ', registrationError);
    });
  });
}
