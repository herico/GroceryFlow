import { createApp } from 'vue'
import { createPinia, type Pinia } from 'pinia'
import './style.css'
import App from './App.vue'
import { router } from './router'
import { i18n } from './i18n'
import { initTheme } from './services/theme'
import { runMigrations } from './services/migrations'
import { initInstallPrompt } from './services/installPrompt'
import { useNotificationsStore } from './stores/notifications'

// Migrate any older persisted data forward before the stores read it.
runMigrations()
initTheme()

const pinia = createPinia()
createApp(App).use(pinia).use(i18n).use(router).mount('#app')

if (import.meta.env.PROD) {
  initInstallPrompt(pinia)
}

// Register the offline service worker in production builds only.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  registerServiceWorker(pinia)
}

function registerServiceWorker(pinia: Pinia) {
  const swUrl = `${import.meta.env.BASE_URL}sw.js`

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(swUrl)
      .then((registration) => {
        registration.addEventListener('updatefound', () => {
          const installing = registration.installing
          if (!installing) return
          installing.addEventListener('statechange', () => {
            // A new worker finished installing while an old one still controls the
            // page → an update is waiting. Offer the user a reload.
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              promptUpdate(pinia, registration)
            }
          })
        })
      })
      .catch(() => {
        /* offline support is progressive — ignore registration failures */
      })
  })
}

function promptUpdate(pinia: Pinia, registration: ServiceWorkerRegistration) {
  const notifications = useNotificationsStore(pinia)
  notifications.notify({
    message: i18n.global.t('common.updateAvailable'),
    actionLabel: i18n.global.t('common.reload'),
    onAction: () => {
      // Reload only once the new worker has taken control. Scoping this here (not a
      // global controllerchange listener) avoids an unwanted reload on first install,
      // where clients.claim() also fires controllerchange.
      navigator.serviceWorker.addEventListener(
        'controllerchange',
        () => window.location.reload(),
        { once: true },
      )
      registration.waiting?.postMessage('skipWaiting')
    },
    timeout: 0,
  })
}
