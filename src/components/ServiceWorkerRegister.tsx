'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => console.log('[SW] Registrado:', reg.scope))
        .catch((err) => console.warn('[SW] Falha ao registrar:', err))
    }
  }, [])

  return null
}
