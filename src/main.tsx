import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Initialize Google Analytics if measurement ID is provided or fallback exists
const meta = import.meta as any;
const gaId = meta.env?.VITE_GA_MEASUREMENT_ID || 'G-M5J96QSW35';

if (gaId && typeof window !== 'undefined') {
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
  document.head.appendChild(script);

  const win = window as any;
  win.dataLayer = win.dataLayer || [];
  win.gtag = function () {
    win.dataLayer.push(arguments);
  };
  win.gtag('js', new Date());
  win.gtag('config', gaId, {
    anonymize_ip: true,
    cookie_flags: 'SameSite=None;Secure'
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
