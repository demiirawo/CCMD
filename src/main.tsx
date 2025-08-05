import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log('=== React App Starting ===');
console.log('Initial URL:', window.location.href);
console.log('Initial pathname:', window.location.pathname);

createRoot(document.getElementById("root")!).render(<App />);
