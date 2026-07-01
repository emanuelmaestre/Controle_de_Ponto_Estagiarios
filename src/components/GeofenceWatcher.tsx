'use client'

import { useEffect, useRef, useState } from 'react'
import { MapPin, X } from 'lucide-react'

interface GeofenceWatcherProps {
  openRecordId: string | null
  geoExempt: boolean
  labLat: number | null
  labLng: number | null
  /** Raio em metros — padrão 200 */
  radiusMeters?: number
}

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(a))
}

export default function GeofenceWatcher({
  openRecordId,
  geoExempt,
  labLat,
  labLng,
  radiusMeters = 200,
}: GeofenceWatcherProps) {
  const [toast, setToast] = useState<string | null>(null)
  const triggered = useRef(false)
  const watchIdRef = useRef<number | null>(null)

  useEffect(() => {
    // Não monitorar se: sem registro aberto, isenção geo, sem coords do lab ou já disparou
    if (!openRecordId || geoExempt || labLat == null || labLng == null) return
    if (!navigator.geolocation) return

    const handlePosition = async (pos: GeolocationPosition) => {
      if (triggered.current) return
      const dist = haversineMeters(pos.coords.latitude, pos.coords.longitude, labLat, labLng)
      if (dist <= radiusMeters) return

      // Passou do raio — fechar registro automaticamente
      triggered.current = true

      try {
        const res = await fetch('/api/clock/auto-out', { method: 'POST' })
        if (!res.ok) {
          triggered.current = false
          return
        }
        setToast(
          'Seu registro de ponto foi fechado automaticamente porque você saiu do laboratório. Registre as atividades realizadas no Histórico.',
        )
      } catch {
        triggered.current = false
      }
    }

    watchIdRef.current = navigator.geolocation.watchPosition(handlePosition, undefined, {
      enableHighAccuracy: false,
      maximumAge: 30_000,
      timeout: 20_000,
    })

    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
    }
  }, [openRecordId, geoExempt, labLat, labLng, radiusMeters])

  if (!toast) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 'calc(env(safe-area-inset-bottom) + 72px)',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        width: 'min(calc(100vw - 32px), 420px)',
        background: 'rgba(15,35,24,0.98)',
        border: '1px solid rgba(255,191,0,0.35)',
        borderRadius: 16,
        padding: '14px 16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
      }}
    >
      <MapPin size={18} style={{ color: '#ffbf00', flexShrink: 0, marginTop: 1 }} />
      <p style={{ color: '#ffbf00', fontSize: 12, lineHeight: 1.5, flex: 1 }}>
        {toast}
      </p>
      <button
        onClick={() => setToast(null)}
        style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0, lineHeight: 0 }}
      >
        <X size={16} />
      </button>
    </div>
  )
}
