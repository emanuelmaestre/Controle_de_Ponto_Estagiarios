'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Camera, RotateCcw, Check, Loader2, AlertTriangle, ShieldCheck, FlipHorizontal2,
} from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

interface Props {
  hasPhoto: boolean
  internId: string
}

export default function SelfieGate({ hasPhoto, internId }: Props) {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [visible, setVisible] = useState(!hasPhoto)
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null)
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [camError, setCamError] = useState<string | null>(null)
  const [camReady, setCamReady] = useState(false)
  const [done, setDone] = useState(false)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')
  const [flipping, setFlipping] = useState(false)

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }, [])

  const startCamera = useCallback(async (facing: 'user' | 'environment') => {
    setCamError(null)
    setCamReady(false)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 720 }, height: { ideal: 720 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => setCamReady(true)
      }
    } catch {
      setCamError('Câmera não autorizada. Permita o acesso e recarregue a página.')
    }
  }, [])

  useEffect(() => {
    if (!visible) return
    startCamera(facingMode)
    return () => stopStream()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  const flipCamera = async () => {
    if (flipping || !camReady) return
    setFlipping(true)
    stopStream()
    const next: 'user' | 'environment' = facingMode === 'user' ? 'environment' : 'user'
    setFacingMode(next)
    await startCamera(next)
    setTimeout(() => setFlipping(false), 400)
  }

  if (!visible) return null

  const isMirror = facingMode === 'user'

  const capture = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    const size = Math.min(video.videoWidth, video.videoHeight)
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')!
    const offsetX = (video.videoWidth - size) / 2
    const offsetY = (video.videoHeight - size) / 2
    if (isMirror) {
      ctx.save()
      ctx.scale(-1, 1)
      ctx.drawImage(video, offsetX, offsetY, size, size, -size, 0, size, size)
      ctx.restore()
    } else {
      ctx.drawImage(video, offsetX, offsetY, size, size, 0, 0, size, size)
    }
    canvas.toBlob(blob => {
      if (!blob) return
      setCapturedBlob(blob)
      setCapturedUrl(canvas.toDataURL('image/jpeg', 0.9))
      stopStream()
    }, 'image/jpeg', 0.9)
  }

  const retake = () => {
    setCapturedBlob(null)
    setCapturedUrl(null)
    startCamera(facingMode)
  }

  const upload = async () => {
    if (!capturedBlob) return
    setUploading(true)
    try {
      const fileName = `${internId}/selfie_${Date.now()}.jpg`
      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(fileName, capturedBlob, { upsert: true, contentType: 'image/jpeg' })
      if (upErr) throw upErr

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName)

      const { error: profileErr } = await supabase
        .from('profiles')
        .update({ photo_url: publicUrl })
        .eq('id', internId)
      if (profileErr) throw profileErr

      setDone(true)
      setTimeout(() => {
        setVisible(false)
        router.refresh()
      }, 1600)
    } catch (e) {
      console.error(e)
      setCamError('Erro ao salvar foto. Tente novamente.')
      setUploading(false)
    }
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)' }}
        >
          {/* Decorative orbs */}
          <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(30,92,45,0.18) 0%, transparent 70%)' }} />
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)' }} />

          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className="w-full max-w-sm rounded-3xl overflow-hidden relative"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
            }}
          >
            {/* ── Header ── */}
            <div
              className="px-6 pt-6 pb-5"
              style={{ borderBottom: '1px solid var(--border)', background: 'rgba(30,92,45,0.06)' }}
            >
              <div className="flex items-center gap-3 mb-1">
                <motion.div
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(30,92,45,0.18)', border: '1px solid rgba(30,92,45,0.3)' }}
                >
                  <Camera size={20} style={{ color: 'var(--primary-light)' }} />
                </motion.div>
                <div>
                  <p className="font-black text-sm tracking-wide" style={{ color: 'var(--text)' }}>
                    FOTO DE IDENTIFICAÇÃO
                  </p>
                  <p className="text-[10px] font-medium" style={{ color: 'var(--text-3)' }}>
                    Obrigatória para acesso ao sistema
                  </p>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-3 rounded-xl px-3 py-2.5 flex items-start gap-2.5"
                style={{ background: 'rgba(30,92,45,0.10)', border: '1px solid rgba(30,92,45,0.2)' }}
              >
                <ShieldCheck size={13} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--primary-light)' }} />
                <p className="text-[10px] leading-relaxed" style={{ color: 'var(--text-2)' }}>
                  Sua foto é usada para identificação nos registros de ponto.
                  Você poderá atualizá-la depois nas configurações do perfil.
                </p>
              </motion.div>
            </div>

            {/* ── Content ── */}
            <div className="px-6 py-5 space-y-4">

              {/* Success state */}
              {done ? (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 22 }}
                  className="flex flex-col items-center gap-3 py-6"
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.6, repeat: 2 }}
                    className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(22,163,74,0.15)', border: '2px solid var(--success)' }}
                  >
                    <Check size={28} style={{ color: 'var(--success)' }} />
                  </motion.div>
                  <p className="font-black text-sm" style={{ color: 'var(--success)' }}>FOTO SALVA COM SUCESSO!</p>
                  <p className="text-[10px]" style={{ color: 'var(--text-3)' }}>Redirecionando…</p>
                </motion.div>
              ) : (
                <>
                  {/* Error */}
                  {camError && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl px-3 py-2.5 flex items-start gap-2.5"
                      style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)' }}
                    >
                      <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--danger)' }} />
                      <p className="text-xs" style={{ color: 'var(--danger)' }}>{camError}</p>
                    </motion.div>
                  )}

                  {/* Camera / Preview */}
                  <div className="flex justify-center">
                    {capturedUrl ? (
                      /* Preview */
                      <motion.div
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative rounded-2xl overflow-hidden"
                        style={{ width: 220, height: 220 }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={capturedUrl} alt="Selfie" className="w-full h-full object-cover" />
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.15 }}
                          className="absolute inset-0 rounded-2xl"
                          style={{ border: '3px solid var(--primary)', boxShadow: '0 0 28px rgba(30,92,45,0.5)' }}
                        />
                        <motion.div
                          initial={{ scale: 0, rotate: -20 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ delay: 0.25, type: 'spring', stiffness: 400 }}
                          className="absolute bottom-2.5 right-2.5 w-9 h-9 rounded-full flex items-center justify-center"
                          style={{ background: 'var(--primary)', boxShadow: '0 4px 16px rgba(30,92,45,0.6)' }}
                        >
                          <Check size={18} color="white" />
                        </motion.div>
                      </motion.div>
                    ) : (
                      /* Live feed */
                      <div className="relative" style={{ width: 220, height: 220 }}>
                        {/* Flip animation wrapper */}
                        <motion.div
                          animate={{ rotateY: flipping ? 90 : 0 }}
                          transition={{ duration: 0.2 }}
                          className="rounded-2xl overflow-hidden bg-black w-full h-full"
                        >
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                            style={{ transform: isMirror ? 'scaleX(-1)' : 'none' }}
                          />
                          {/* Corner guides */}
                          {['top-2 left-2', 'top-2 right-2', 'bottom-2 left-2', 'bottom-2 right-2'].map((pos, i) => (
                            <div
                              key={i}
                              className={`absolute ${pos} w-5 h-5 pointer-events-none`}
                              style={{
                                borderTop: i < 2 ? '2px solid rgba(74,222,128,0.7)' : 'none',
                                borderBottom: i >= 2 ? '2px solid rgba(74,222,128,0.7)' : 'none',
                                borderLeft: i % 2 === 0 ? '2px solid rgba(74,222,128,0.7)' : 'none',
                                borderRight: i % 2 === 1 ? '2px solid rgba(74,222,128,0.7)' : 'none',
                                borderRadius: i === 0 ? '4px 0 0 0' : i === 1 ? '0 4px 0 0' : i === 2 ? '0 0 0 4px' : '0 0 4px 0',
                              }}
                            />
                          ))}
                          {/* Scan line */}
                          {camReady && (
                            <motion.div
                              className="absolute left-0 right-0 h-px pointer-events-none"
                              style={{ background: 'linear-gradient(90deg, transparent, rgba(74,222,128,0.6), transparent)' }}
                              animate={{ top: ['10%', '90%', '10%'] }}
                              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                            />
                          )}
                          {!camReady && !camError && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Loader2 size={28} className="animate-spin" style={{ color: 'rgba(255,255,255,0.5)' }} />
                            </div>
                          )}
                        </motion.div>

                        {/* Camera flip button — floating top-right */}
                        <motion.button
                          onClick={flipCamera}
                          disabled={!camReady || flipping}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.88 }}
                          className="absolute top-2 right-2 w-9 h-9 rounded-xl flex items-center justify-center disabled:opacity-40 z-10"
                          style={{
                            background: 'rgba(0,0,0,0.55)',
                            backdropFilter: 'blur(6px)',
                            border: '1px solid rgba(255,255,255,0.15)',
                          }}
                          title={facingMode === 'user' ? 'Usar câmera traseira' : 'Usar câmera frontal'}
                        >
                          <motion.div
                            animate={{ rotate: flipping ? 180 : 0 }}
                            transition={{ duration: 0.4 }}
                          >
                            <FlipHorizontal2 size={16} color="white" />
                          </motion.div>
                        </motion.button>

                        {/* Camera label badge */}
                        <motion.div
                          key={facingMode}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="absolute bottom-2 left-2 px-2 py-0.5 rounded-lg text-[9px] font-bold"
                          style={{ background: 'rgba(0,0,0,0.55)', color: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(4px)' }}
                        >
                          {facingMode === 'user' ? '📱 FRONTAL' : '📷 TRASEIRA'}
                        </motion.div>
                      </div>
                    )}
                  </div>

                  <canvas ref={canvasRef} className="hidden" />

                  {/* Hint */}
                  <p className="text-center text-[10px] font-medium" style={{ color: 'var(--text-3)' }}>
                    {capturedUrl
                      ? 'Ficou bom? Confirme para continuar.'
                      : facingMode === 'user'
                      ? 'Câmera frontal — posicione seu rosto no centro.'
                      : 'Câmera traseira — aponte para o seu rosto.'}
                  </p>

                  {/* Buttons */}
                  {capturedUrl ? (
                    <div className="flex gap-2.5">
                      <motion.button
                        onClick={retake}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        className="flex-1 py-3 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm"
                        style={{ background: 'var(--bg)', border: '1.5px solid var(--border)', color: 'var(--text-2)' }}
                      >
                        <RotateCcw size={14} /> REFAZER
                      </motion.button>
                      <motion.button
                        onClick={upload}
                        disabled={uploading}
                        whileHover={{ scale: 1.02, y: -1 }}
                        whileTap={{ scale: 0.97 }}
                        className="flex-1 py-3 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm disabled:opacity-60"
                        style={{ background: 'var(--primary)', color: 'white', boxShadow: '0 4px 18px rgba(30,92,45,0.4)' }}
                      >
                        {uploading
                          ? <><Loader2 size={14} className="animate-spin" /> SALVANDO…</>
                          : <><Check size={14} /> CONFIRMAR</>
                        }
                      </motion.button>
                    </div>
                  ) : (
                    <motion.button
                      onClick={capture}
                      disabled={!camReady || !!camError}
                      whileHover={camReady ? { scale: 1.02, y: -1 } : {}}
                      whileTap={camReady ? { scale: 0.97 } : {}}
                      className="w-full py-4 rounded-2xl flex items-center justify-center gap-2.5 font-black text-sm disabled:opacity-50"
                      style={{
                        background: 'var(--primary)',
                        color: 'white',
                        boxShadow: '0 6px 24px rgba(30,92,45,0.45)',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {camReady
                        ? <><Camera size={18} /> TIRAR FOTO</>
                        : <><Loader2 size={16} className="animate-spin" /> INICIANDO CÂMERA…</>
                      }
                    </motion.button>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
