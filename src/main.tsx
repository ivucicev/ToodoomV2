import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Auto-reload when a new service worker is available
registerSW({
  immediate: true,
  onNeedRefresh() {
    // New version deployed — reload to activate it
    window.location.reload();
  },
  onOfflineReady() {
    console.log('[PWA] Ready for offline use');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
