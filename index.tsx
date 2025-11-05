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
    // FIX: `import.meta.env.BASE_URL` is unavailable at runtime in this environment.
    // The base path is determined by reading the canonical URL from the document head.
    // This approach is robust for both local development and GitHub Pages deployment.
    let base = '/';
    const canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink) {
      try {
        const canonicalUrl = new URL((canonicalLink as HTMLLinkElement).href);
        base = canonicalUrl.pathname;
      } catch (e) {
        console.error('Failed to parse canonical URL:', e);
      }
    }

    const swUrl = `${base}sw.js`;
    
    navigator.serviceWorker.register(swUrl, { scope: base }).then(registration => {
      console.log('Service Worker registered with scope: ', registration.scope);
    }).catch(registrationError => {
      console.log('Service Worker registration failed: ', registrationError);
    });
  });
}
