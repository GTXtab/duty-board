import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { readGoogleClientId } from './config/env';
import './styles.css';

const container = document.getElementById('root');
if (!container) throw new Error('Root element #root is missing');

const googleClientId = readGoogleClientId(import.meta.env.VITE_GOOGLE_CLIENT_ID);

createRoot(container).render(
  <StrictMode>
    <App googleClientId={googleClientId} />
  </StrictMode>,
);
