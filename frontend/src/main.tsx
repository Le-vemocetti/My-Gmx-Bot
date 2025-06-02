import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/global.css'; // ✅ Updated path to moved CSS file
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
