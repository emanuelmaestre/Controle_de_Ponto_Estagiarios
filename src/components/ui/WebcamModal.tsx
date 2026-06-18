'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, X, AlertTriangle, Loader2 } from 'lucide-react'

type ErrorType = 'permission' | 'not_found' | 'in_use' | 'unsupported' | 'https' | 'unknown'

const ERROR_MESSAGES: Record<ErrorType, { title: string; desc: string }> = {
  permission:  { title: 'Permissão negada',      desc: 'Permita o acesso à câmera nas configurações do navegador e tente novamente.' },
  not_found:   { title: 'Câmera não encontrada', desc: 'Nenhuma câmera foi detectada neste dispositivo.' },
  in_use:      { title: 'Câmera em uso',          desc: 'A câmera está sendo usada por outro aplicativo. Feche-o e tente novamente.' },
  unsupported: { title: 'Não suportado',          desc: 'Seu navegador não suporta acesso à câmera.' },
  https:       { title: 'Conexão insegura',       desc: 'O acesso à câmera requer uma conexão segura (HTTPS).' },
  unknown:     { title: 'Erro desconhecido',      desc: 'Não foi possível acessar a câmera. Tente novamente.' },
}

interface Props {
  onCapture: (src: string) => void
  onCancel: () => void
}

export default function WebcamModal({ onCapture, onCancel }: Props) {
  const videoRef  = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<ErrorType | null>(null)

  useEffect(() => {
    let cancelled = false

    const startCamera = async () => {
      // Sem suporte à API
      if (!navigator.mediaDevices?.getUserMedia) {
        const isHttp = typeof location !== 'undefined' &&
          location.protocol !== 'https:' &&
          location.hostname !== 'localhost'
        setError(isHttp ? 'https' : 'unsupported')
        return
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        })

        if (cancelled) {
          stream.getTracks().forEach(t => t.stop())
          return
        }

        streamRef.current = stream

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.onloadedmetadata = () => {
            if (!cancelled) setReady(true)
          }
        }
      } catch (err: unknown) {
        if (cancelled) return
        const name = err instanceof Error ? err.name : ''
        if (name === 'NotAllowedError' || name === 'PermissionDeniedError') setError('permission')
        else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') setError('not_found')
        else if (name === 'NotReadableError' || name === 'TrackStartError')  setError('in_use')
        else setError('unknown')
      }
    }

    startCamera()

    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  const stopStream = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }

  const handleCancel = () => {
    stopStream()
    onCancel()
  }

  const takeSnapshot = () => {
    const video = videoRef.current
    if (!video || !ready) return

    const canvas = document.createElement('canvas')
    canvas.width  = video.videoWidth  || 640
    canvas.height = video.videoHeight || 480
    canvas.getContext('2d')!.drawImage(video, 0, 0)

    stopStream()
    onCapture(canvas.toDataURL('image/jpeg', 0.95))
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.85)' }}
        onClick={handleCancel}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          onClick={e => e.stopPropagation()}
          className="w-full rounded-2xl overflow-hidden"
          style={{ maxWidth: 480, background: '#0a1a0f', border: '1px solid rgba(0,200,83,0.2)' }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: '1px solid rgba(0,200,83,0.1)' }}
          >
            <div className="flex items-center gap-2">
              <Camera size={16} style={{ color: '#00c853' }} />
              <span className="text-sm font-semibold" style={{ color: '#e2f5e9' }}>Câmera</span>
            </div>
            <button
              onClick={handleCancel}
              className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
            >
              <X size={16} style={{ color: '#4a7a5a' }} />
            </button>
          </div>

          {/* Vídeo */}
          <div className="relative bg-black w-full" style={{ aspectRatio: '4/3' }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ display: ready ? 'block' : 'none', transform: 'scaleX(-1)' }}
            />

            {/* Loading */}
            {!ready && !error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <Loader2 size={28} className="animate-spin" style={{ color: '#00c853' }} />
                <p className="text-sm" style={{ color: '#4a7a5a' }}>Iniciando câmera...</p>
              </div>
            )}

            {/* Erro */}
            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
                <AlertTriangle size={28} style={{ color: '#ef4444' }} />
                <p className="text-sm font-semibold" style={{ color: '#ef4444' }}>
                  {ERROR_MESSAGES[error].title}
                </p>
                <p className="text-xs leading-relaxed" style={{ color: '#4a7a5a' }}>
                  {ERROR_MESSAGES[error].desc}
                </p>
              </div>
            )}

            {/* Guia circular */}
            {ready && (
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <div
                  className="rounded-full"
                  style={{
                    width: '60%',
                    aspectRatio: '1',
                    border: '2px dashed rgba(0,200,83,0.5)',
                    boxShadow: '0 0 0 9999px rgba(0,0,0,0.35)',
                  }}
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            className="px-5 py-4 flex gap-3"
            style={{ borderTop: '1px solid rgba(0,200,83,0.1)' }}
          >
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium hover:opacity-70 transition-colors"
              style={{ border: '1px solid rgba(0,200,83,0.2)', color: '#4a7a5a' }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={takeSnapshot}
              disabled={!ready}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-40 transition-all"
              style={{ background: '#00c853', color: '#003912' }}
            >
              <Camera size={15} /> Tirar foto
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
