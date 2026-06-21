'use client'

import { useEffect, useState } from 'react'

export default function PushSubscribe() {
  const [supported, setSupported] = useState(false)
  const [subscribed, setSubscribed] = useState(false)

  useEffect(() => {
    queueMicrotask(() => {
      setSupported('PushManager' in window && 'serviceWorker' in navigator)
    })
    // Verificar se já tem inscrição
    navigator.serviceWorker?.ready.then(reg =>
      reg.pushManager.getSubscription().then(sub => setSubscribed(!!sub))
    )
  }, [])

  const subscribe = async () => {
    try {
      const reg = await navigator.serviceWorker.ready
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) return

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })

      // Enviar subscription ao servidor
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          p256dh: bufferToBase64(sub.getKey('p256dh')),
          auth: bufferToBase64(sub.getKey('auth')),
          userAgent: navigator.userAgent,
        }),
      })
      setSubscribed(true)
    } catch (err) {
      console.error('[Push] Erro ao inscrever:', err)
    }
  }

  if (!supported || subscribed) return null

  return (
    <button
      onClick={subscribe}
      className="fixed bottom-4 right-4 z-50 bg-blue-900 text-white text-sm font-semibold px-4 py-3 rounded-xl shadow-lg hover:bg-blue-800 transition-colors flex items-center gap-2"
    >
      🔔 Ativar lembretes
    </button>
  )
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}

function bufferToBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) return ''
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
}
