import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { applyBrandTokensToRoot } from './data/brandSettings';

applyBrandTokensToRoot();

createRoot(document.getElementById('root')!).render(<App />);
