// FIX: Removed the `vite/client` type reference. It was causing a "Cannot find
// type definition file" error and is no longer needed because the application
// logic was updated to not rely on `import.meta.env`.
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
    // FIX: Replaced the simple relative path with a robust, absolute path
    // including the deployment subdirectory. This ensures the service worker
    // is always found, and explicitly setting the scope guarantees it controls
    // the correct pages. This is the standard best practice for SPAs on GitHub Pages.
    const swUrl = '/depenses-mensuel/sw.js';
    navigator.serviceWorker.register(swUrl, { scope: '/depenses-mensuel/' }).then(registration => {
      console.log('Service Worker registered with scope: ', registration.scope);
    }).catch(registrationError => {
      console.log('Service Worker registration failed: ', registrationError);
    });
  });
}