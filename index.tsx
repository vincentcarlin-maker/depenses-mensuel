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
