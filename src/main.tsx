import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log('=== React App Starting ===');
console.log('Initial URL:', window.location.href);
console.log('Initial pathname:', window.location.pathname);

// Add navigation listener to catch redirects
let originalPushState = window.history.pushState;
let originalReplaceState = window.history.replaceState;

window.history.pushState = function(...args) {
  console.log('history.pushState called:', args[2]);
  return originalPushState.apply(window.history, args);
};

window.history.replaceState = function(...args) {
  console.log('history.replaceState called:', args[2]);
  return originalReplaceState.apply(window.history, args);
};

window.addEventListener('popstate', function(event) {
  console.log('popstate event:', window.location.pathname);
});

createRoot(document.getElementById("root")!).render(<App />);
