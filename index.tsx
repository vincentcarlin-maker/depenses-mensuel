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
    // FIX: Replaced complex canonical URL parsing with a simple, robust path.
    // Registering 'sw.js' directly allows the browser to resolve the path
    // correctly relative to the current location, which works seamlessly for
    // subdirectory deployments on GitHub Pages.
    navigator.serviceWorker.register('sw.js').then(registration => {
      console.log('Service Worker registered with scope: ', registration.scope);
    }).catch(registrationError => {
      console.log('Service Worker registration failed: ', registrationError);
    });
  });
}
