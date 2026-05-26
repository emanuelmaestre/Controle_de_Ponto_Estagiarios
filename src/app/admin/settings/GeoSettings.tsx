'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, ToggleLeft, ToggleRight, Save, Navigation, CheckCircle2, AlertTriangle } from 'lucide-react'

interface GeoConfig {
  id: string
  geo_enabled: boolean
  geo_lat: number
  geo_lng: number
  geo_radius_meters: number
}

interface Props {
  config: GeoConfig | null
}

const LAB_LAT = -17.485672
const LAB_LNG = -48.2130547

export default function GeoSettings({ config }: Props) {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  const [enabled, setEnabled] = useState(config?.geo_enabled ?? false)
  const [lat, setLat] = useState(String(config?.geo_lat ?? LAB_LAT))
  const [lng, setLng] = useState(String(config?.geo_lng ?? LAB_LNG))
  const [radius, setRadius] = useState(String(config?.geo_radius_meters ?? 150))
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resetToLab = () => {
    setLat(String(LAB_LAT))
    setLng(String(LAB_LNG))
  }

  const handleSave = async () => {
    const latNum = parseFloat(lat)
    const lngNum = parseFloat(lng)
    const radiusNum = parseInt(radius)

    if (isNaN(latNum) || isNaN(lngNum) || isNaN(radiusNum)) {
      setError('Valores inválidos. Verifique latitude, longitude e raio.')
      return
    }
    if (radiusNum < 50 || radiusNum > 2000) {
      setError('O raio deve estar entre 50 e 2000 metros.')
      return
    }

    setLoading(true)
    setError(null)
    setSaved(false)

    const { error: err } = await supabase
      .from('settings')
      .update({
        geo_enabled: enabled,
        geo_lat: latNum,
        geo_lng: lngNum,
        geo_radius_meters: radiusNum,
      })
      .eq('id', config?.id ?? '')

    setLoading(false)
    if (err) {
      setError('Erro ao salvar. Tente novamente.')
    } else {
      setSaved(true)
      router.refresh()
      setTimeout(() => setSaved(false), 3000)
    }
  }

  const mapUrl = `https://maps.google.com/maps?q=${lat},${lng}&z=17&output=embed`

  return (
    <div className="space-y-6">

      {/* Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
            Validação de localização
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
            {enabled
              ? 'Ativada — estagiários precisam estar no laboratório'
              : 'Desativada — ponto liberado sem restrição geográfica'}
          </p>
        </div>
        <button
          onClick={() => setEnabled(v => !v)}
          className="flex-shrink-0 transition-opacity hover:opacity-80"
        >
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 0.2 }}
            key={String(enabled)}
          >
            {enabled ? (
              <ToggleRight size={40} style={{ color: 'var(--primary)' }} />
            ) : (
              <ToggleLeft size={40} style={{ color: 'var(--text-3)' }} />
            )}
          </motion.div>
        </button>
      </div>

      <AnimatePresence>
        {enabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-5 overflow-hidden"
          >
            {/* Coordinates */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>
                  Localização do laboratório
                </label>
                <button
                  type="button"
                  onClick={resetToLab}
                  className="text-xs font-semibold flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors hover:opacity-80"
                  style={{ background: 'rgba(45,138,66,0.1)', color: 'var(--primary)' }}
                >
                  <Navigation size={11} /> Usar IFGoiano Urutaí
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-3)' }}>
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={lat}
                    onChange={e => setLat(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm font-mono transition-colors"
                    style={{
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      color: 'var(--text)',
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-3)' }}>
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={lng}
                    onChange={e => setLng(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm font-mono transition-colors"
                    style={{
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      color: 'var(--text)',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Radius */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>
                  Raio permitido
                </label>
                <span
                  className="text-sm font-bold tabular-nums"
                  style={{ color: 'var(--primary)' }}
                >
                  {radius}m
                </span>
              </div>
              <input
                type="range"
                min={50}
                max={500}
                step={25}
                value={radius}
                onChange={e => setRadius(e.target.value)}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: 'var(--primary)' }}
              />
              <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-3)' }}>
                <span>50m</span>
                <span>250m</span>
                <span>500m</span>
              </div>
              <p className="text-xs mt-2" style={{ color: 'var(--text-3)' }}>
                Os estagiários precisam estar a menos de{' '}
                <strong style={{ color: 'var(--text-2)' }}>{radius} metros</strong>{' '}
                do ponto central para registrar o ponto.
              </p>
            </div>

            {/* Map preview */}
            <div>
              <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-2)' }}>
                Visualização no mapa
              </p>
              <div
                className="rounded-xl overflow-hidden"
                style={{ height: 200, border: '1px solid var(--border)' }}
              >
                <iframe
                  src={mapUrl}
                  width="100%"
                  height="200"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Localização do laboratório"
                />
              </div>
              <p className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--text-3)' }}>
                <MapPin size={11} />
                Laboratório de Microbiologia e Fitopatologia — IFGoiano Campus Urutaí
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feedback */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 text-sm px-3 py-2.5 rounded-xl"
            style={{ background: 'rgba(239,68,68,0.08)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            <AlertTriangle size={14} /> {error}
          </motion.div>
        )}
        {saved && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 text-sm px-3 py-2.5 rounded-xl"
            style={{ background: 'rgba(22,163,74,0.08)', color: 'var(--success)', border: '1px solid rgba(22,163,74,0.2)' }}
          >
            <CheckCircle2 size={14} /> Configurações salvas com sucesso!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={loading}
        className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-opacity disabled:opacity-60 hover:opacity-90"
        style={{ background: 'var(--primary)', color: 'white' }}
      >
        {loading ? (
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
            <Navigation size={14} />
          </motion.div>
        ) : (
          <Save size={14} />
        )}
        {loading ? 'Salvando…' : 'Salvar configurações de localização'}
      </button>
    </div>
  )
}
