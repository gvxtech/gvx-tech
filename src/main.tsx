import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom';

import './styles/main.css';
import App from './App';
import OrganizationSchema from './seo/OrganizationSchema';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <OrganizationSchema />
        <App />
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>
);