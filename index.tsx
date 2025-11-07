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

// Register the service worker for PWA functionality.
// This is done after the app is loaded to not delay the initial render.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Register the service worker using a relative path.
    // This works both in development and when deployed in a sub-directory.
    navigator.serviceWorker.register('sw.js')
      .then(registration => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      })
      .catch(error => {
        console.log('ServiceWorker registration failed: ', error);
      });
  });
}