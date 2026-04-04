import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import CMSApp from './CMSApp';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CMSApp />
  </StrictMode>,
);
