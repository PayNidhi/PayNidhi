import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from "react-hot-toast";
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          className: "text-sm font-medium",
          style: {
            borderRadius: "0.75rem",
            padding: "10px 12px",
          },
        }}
      />
    </BrowserRouter>
  </StrictMode>
);