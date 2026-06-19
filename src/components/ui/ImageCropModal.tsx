'use client'

import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ZoomIn, ZoomOut, RotateCw, Check, Camera, RotateCcw } from 'lucide-react'

interface CropArea { x: number; y: number; width: number; height: number }

async function getCroppedImg(imageSrc: string, cropArea: CropArea, rotation: number): Promise<File> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = imageSrc
  })

  const canvas = document.createElement('canvas')
  const size = Math.max(cropArea.width, cropArea.height)
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  ctx.translate(size / 2, size / 2)
  ctx.rotate((rotation * Math.PI) / 180)
  ctx.translate(-size / 2, -size / 2)

  ctx.drawImage(
    image,
    cropArea.x, cropArea.y, cropArea.width, cropArea.height,
    0, 0, size, size,
  )

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(new File([blob!], 'avatar.jpg', { type: 'image/jpeg' }))
    }, 'image/jpeg', 0.92)
  })
}

interface Props {
  src: string
  onConfirm: (file: File, preview: string) => void
  onCancel: () => void
}

export default function ImageCropModal({ src, onConfirm, onCancel }: Props) {
  const [crop, setCrop]       = useState({ x: 0, y: 0 })
  const [zoom, setZoom]       = useState(1)
  const [rotation, setRotation] = useState(0)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null)
  const [loading, setLoading] = useState(false)

  const onCropComplete = useCallback((_: unknown, pixels: CropArea) => {
    setCroppedAreaPixels(pixels)
  }, [])

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return
    setLoading(true)
    try {
      const file = await getCroppedImg(src, croppedAreaPixels, rotation)
      const preview = URL.createObjectURL(file)
      onConfirm(file, preview)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.85)' }}
        onClick={onCancel}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-md rounded-2xl overflow-hidden"
          style={{ background: '#0a1a0f', border: '1px solid rgba(0,200,83,0.2)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(0,200,83,0.1)' }}>
            <div className="flex items-center gap-2">
              <Camera size={16} style={{ color: '#00c853' }} />
              <span className="text-sm font-semibold" style={{ color: 'var(--text, #e2f5e9)' }}>
                Ajustar Foto
              </span>
            </div>
            <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
              <X size={16} style={{ color: 'var(--text-3, #4a7a5a)' }} />
            </button>
          </div>

          {/* Crop area */}
          <div className="relative" style={{ height: 320, background: '#000' }}>
            <Cropper
              image={src}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              style={{
                containerStyle: { background: '#000' },
                cropAreaStyle: { border: '2px solid #00c853', boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)' },
              }}
            />
          </div>

          {/* Controls */}
          <div className="px-5 py-4 space-y-4" style={{ borderTop: '1px solid rgba(0,200,83,0.1)' }}>
            {/* Reset */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => { setZoom(1); setRotation(0); setCrop({ x: 0, y: 0 }) }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-medium transition-opacity hover:opacity-70"
                style={{ color: 'var(--text-3, #4a7a5a)', border: '1px solid rgba(0,200,83,0.12)' }}
              >
                <RotateCcw size={10} /> Redefinir
              </button>
            </div>
            {/* Zoom */}
            <div className="flex items-center gap-3">
              <ZoomOut size={14} style={{ color: 'var(--text-3, #4a7a5a)', flexShrink: 0 }} />
              <input
                type="range" min={1} max={3} step={0.05}
                value={zoom}
                onChange={e => setZoom(Number(e.target.value))}
                className="flex-1 h-1 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: '#00c853' }}
              />
              <ZoomIn size={14} style={{ color: 'var(--text-3, #4a7a5a)', flexShrink: 0 }} />
            </div>

            {/* Rotation */}
            <div className="flex items-center gap-3">
              <RotateCw size={14} style={{ color: 'var(--text-3, #4a7a5a)', flexShrink: 0 }} />
              <input
                type="range" min={-180} max={180} step={1}
                value={rotation}
                onChange={e => setRotation(Number(e.target.value))}
                className="flex-1 h-1 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: '#00c853' }}
              />
              <span className="text-[10px] w-8 text-right" style={{ color: 'var(--text-3, #4a7a5a)' }}>
                {rotation}°
              </span>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors hover:opacity-70"
                style={{ border: '1px solid rgba(0,200,83,0.2)', color: 'var(--text-3, #4a7a5a)' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                style={{ background: '#00c853', color: '#003912' }}
              >
                {loading ? (
                  <span className="animate-spin">⏳</span>
                ) : (
                  <><Check size={15} /> Confirmar</>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
