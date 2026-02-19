import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.jsx'

// Registra o service worker PWA
const updateSW = registerSW({
  onRegisteredSW(swUrl, registration) {
    console.log('✅ SW registrado:', swUrl);

    if (registration && Notification.permission === 'granted') {
      // Tenta registrar Periodic Background Sync (Chrome PWA)
      if ('periodicSync' in registration) {
        registration.periodicSync.register('hunter-journal-notification', {
          minInterval: 4 * 60 * 60 * 1000, // 4 horas
        }).then(() => {
          console.log('🔄 Periodic sync registrado');
        }).catch((err) => {
          console.log('⚠️ Periodic sync não suportado, usando fallback');
          registration.active?.postMessage({ type: 'START_PERIODIC_NOTIFICATIONS' });
        });
      } else {
        // Fallback: pede ao SW para iniciar setInterval
        registration.active?.postMessage({ type: 'START_PERIODIC_NOTIFICATIONS' });
      }
    }
  },
  onOfflineReady() {
    console.log('📴 App pronto para uso offline');
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

