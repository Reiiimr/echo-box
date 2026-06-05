import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import './i18n/index.js';
import './index.css';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              fontFamily: "'Special Elite', cursive",
              background: '#2c1810',
              color: '#fdf6e3',
              border: '2px solid #5c3317',
              borderRadius: '4px',
            },
            success: { iconTheme: { primary: '#b8860b', secondary: '#fdf6e3' } },
            error:   { iconTheme: { primary: '#8b3a2a', secondary: '#fdf6e3' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
