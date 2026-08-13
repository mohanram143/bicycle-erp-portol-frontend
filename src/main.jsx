import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './styles/global.css';
import { useThemeStore } from './store/themeStore.js';

// Apply saved/system theme before first paint to avoid a flash.
document.documentElement.setAttribute('data-theme', useThemeStore.getState().theme);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);