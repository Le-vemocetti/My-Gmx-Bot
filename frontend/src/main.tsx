import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../public/styles.css' // ✅ Import compiled Tailwind CSS
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
