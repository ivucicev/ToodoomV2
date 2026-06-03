import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Prevent iOS Safari rubber-band scroll when page content doesn't fill viewport
// overscroll-behavior:none doesn't work on older iOS — need touchmove preventDefault
let startY = 0;
document.addEventListener('touchstart', (e) => {
  startY = e.touches[0].clientY;
}, { passive: true });

document.addEventListener('touchmove', (e) => {
  const dy = e.touches[0].clientY - startY;
  const el = e.target as HTMLElement;
  // Walk up the DOM to find a scrollable ancestor
  let scrollable: HTMLElement | null = el;
  while (scrollable && scrollable !== document.documentElement) {
    const style = window.getComputedStyle(scrollable);
    const overflow = style.overflowY;
    const canScroll = overflow === 'auto' || overflow === 'scroll';
    if (canScroll && scrollable.scrollHeight > scrollable.clientHeight) {
      // Found scrollable element — allow native scroll
      return;
    }
    scrollable = scrollable.parentElement;
  }
  // No scrollable ancestor found — prevent document bounce
  e.preventDefault();
}, { passive: false });

// Auto-reload when a new service worker is available
registerSW({
  immediate: true,
  onNeedRefresh() {
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
