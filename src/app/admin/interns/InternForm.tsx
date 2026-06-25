'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import imageCompression from 'browser-image-compression'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import {
  CheckCircle2, AlertTriangle, Loader2, Camera,
  Lock, Save, RotateCcw, Upload, X, Send, MapPinOff,
} from 'lucide-react'
import { toast } from 'sonner'
import { internSchema } from '@/lib/validations'
import { formatFullName } from '@/lib/utils'
import type { Profile } from '@/types/database'
import DatePicker from '@/components/ui/DatePicker'
import CourseSelect from '@/components/ui/CourseSelect'
import ImageCropModal from '@/components/ui/ImageCropModal'
import WebcamModal from '@/components/ui/WebcamModal'
import { useIsMobile } from '@/hooks/useIsMobile'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/gif', 'image/bmp']
const MAX_SIZE_MB = 5

type InternFormValues = {
  full_name: string
  email: string
  nickname?: string
  course?: string
  internship_start?: string
  internship_end?: string
  is_active: boolean
  geo_exempt: boolean
}

interface Props {
  mode: 'create' | 'edit'
  intern?: Profile
}

/* ── Toggle iOS ─────────────────────────────────────── */
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="relative flex-shrink-0 rounded-full transition-all duration-200"
      style={{
        width: 44, height: 24,
        background: checked ? '#3fe56c' : 'rgba(0,200,83,0.15)',
        border: checked ? '1px solid #3fe56c' : '1px solid rgba(0,200,83,0.25)',
      }}
    >
      <motion.div
        animate={{ x: checked ? 20 : 2 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="absolute top-0.5 w-5 h-5 rounded-full"
        style={{ background: checked ? '#003912' : 'rgba(255,255,255,0.4)' }}
      />
    </button>
  )
}

/* ── Input field ─────────────────────────────────────── */
function Field({
  label, error, children,
}: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-[10px] font-bold tracking-wider uppercase" style={{ color: 'var(--text-3)' }}>
        {label}
      </label>
      {children}
      {error && <p className="text-[10px]" style={{ color: 'var(--danger)' }}>{error}</p>}
    </div>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full px-4 py-3 rounded-lg text-sm focus:outline-none transition-all"
      style={{ background: 'var(--bg)', border: '1px solid rgba(0,200,83,0.15)', color: 'var(--text)' }}
      onFocus={e => (e.target.style.borderColor = '#00c853')}
      onBlur={e  => (e.target.style.borderColor = 'rgba(0,200,83,0.15)')}
    />
  )
}

/* ── Card wrapper ─────────────────────────────────────── */
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl p-6 ${className}`}
      style={{ background: 'var(--surface-card, #0f2318)', border: '1px solid rgba(0,200,83,0.15)' }}
    >
      {children}
    </div>
  )
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold tracking-widest uppercase mb-4" style={{ color: '#3fe56c' }}>
      {children}
    </p>
  )
}

/* ═══════════════════════════════════════════════════════ */
export default function InternForm({ mode, intern }: Props) {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [photoFile, setPhotoFile]       = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(intern?.photo_url ?? null)
  const [cropSrc, setCropSrc]           = useState<string | null>(null)
  const [photoError, setPhotoError]     = useState<string | null>(null)
  const [showWebcam, setShowWebcam]     = useState(false)
  const fileInputRef   = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const isMobile = useIsMobile()

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<InternFormValues>({
    resolver: zodResolver(internSchema),
    defaultValues: intern
      ? {
          full_name:        intern.full_name,
          email:            intern.email,
          nickname:         intern.nickname ?? '',
          course:           intern.course ?? '',
          internship_start: intern.internship_start ?? '',
          internship_end:   intern.internship_end ?? '',
          is_active:        intern.is_active,
          geo_exempt:       intern.geo_exempt ?? false,
        }
      : { is_active: true, geo_exempt: false, internship_start: new Date().toISOString().slice(0, 10) },
  })

  const isActive  = watch('is_active')
  const geoExempt = watch('geo_exempt')

  const handleFileSelected = (file: File) => {
    setPhotoError(null)
    if (!ACCEPTED_TYPES.includes(file.type) && !file.name.match(/\.(heic|heif)$/i)) {
      setPhotoError('Formato não suportado. Use JPG, PNG, WebP, HEIC ou GIF.')
      return
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setPhotoError(`Arquivo muito grande. Máximo ${MAX_SIZE_MB}MB.`)
      return
    }
    setCropSrc(URL.createObjectURL(file))
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    handleFileSelected(file)
    e.target.value = ''
  }

  const handleCropConfirm = async (croppedFile: File, preview: string) => {
    setCropSrc(null)
    try {
      const compressed = await imageCompression(croppedFile, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 600,
        useWebWorker: true,
      })
      setPhotoFile(compressed as File)
      setPhotoPreview(preview)
      toast.success('Foto ajustada e comprimida!')
    } catch {
      setPhotoFile(croppedFile)
      setPhotoPreview(preview)
    }
  }

  const handleRemovePhoto = () => {
    setPhotoFile(null)
    setPhotoPreview(null)
    setPhotoError(null)
  }

  const onSubmit = async (data: InternFormValues) => {
    setLoading(true); setError(null); setSuccess(null)

    let photoUrl: string | null = intern?.photo_url ?? null
    if (photoFile) {
      const ext  = photoFile.name.split('.').pop()
      const path = `avatars/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, photoFile, { upsert: true })
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
        photoUrl = urlData.publicUrl
      }
    }

    if (mode === 'create') {
      const res  = await fetch('/api/admin/create-intern', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, nickname: data.nickname || null, photo_url: photoUrl }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Erro ao cadastrar.'); setLoading(false); return }
      setSuccess('Estagiário cadastrado! Um e-mail de boas-vindas foi enviado.')
      setTimeout(() => router.push('/admin/interns'), 1500)
    } else if (intern) {
      const { error: updateError } = await supabase.from('profiles').update({
        full_name:        formatFullName(data.full_name),
        email:            data.email,
        nickname:         data.nickname || null,
        course:           data.course   || null,
        internship_start: data.internship_start || null,
        internship_end:   data.internship_end   || null,
        is_active:        data.is_active,
        geo_exempt:       data.geo_exempt,
        ...(photoUrl !== null ? { photo_url: photoUrl } : {}),
      }).eq('id', intern.id)

      if (updateError) { setError('Erro ao salvar alterações.'); toast.error('Erro ao salvar alterações.') }
      else { setSuccess('Dados atualizados com sucesso!'); toast.success('Perfil salvo com sucesso!'); router.refresh() }
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">

      {/* ── Feedback ── */}
      <AnimatePresence>
        {error && (
          <motion.div key="err"
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
            style={{ background: 'rgba(255,82,82,0.08)', border: '1px solid rgba(255,82,82,0.2)', color: 'var(--danger)' }}
          >
            <AlertTriangle size={14} className="flex-shrink-0" /> {error}
          </motion.div>
        )}
        {success && (
          <motion.div key="ok"
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
            style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)', color: 'var(--success)' }}
          >
            <CheckCircle2 size={14} className="flex-shrink-0" /> {success}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Webcam modal (desktop) ── */}
      {showWebcam && (
        <WebcamModal
          onCapture={src => { setShowWebcam(false); setCropSrc(src) }}
          onCancel={() => setShowWebcam(false)}
        />
      )}

      {/* ── Crop modal ── */}
      {cropSrc && (
        <ImageCropModal
          src={cropSrc}
          onConfirm={handleCropConfirm}
          onCancel={() => setCropSrc(null)}
        />
      )}

      {/* ── 1. Imagem de Identificação ── */}
      <Card className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8 hover:border-primary/30 transition-all duration-300">
        {/* Avatar circle */}
        <div className="relative flex-shrink-0">
          <div
            className="w-32 h-32 rounded-full flex flex-col items-center justify-center overflow-hidden transition-all"
            style={{ border: '2px dashed rgba(0,200,83,0.35)', background: 'var(--bg)' }}
          >
            {photoPreview ? (
              <img src={photoPreview} alt="Prévia" className="w-full h-full object-cover" />
            ) : (
              <>
                <Camera size={32} style={{ color: 'var(--text-3)' }} />
                <span className="text-[9px] font-bold tracking-wider mt-1.5 uppercase" style={{ color: 'var(--text-3)' }}>
                  FOTO
                </span>
              </>
            )}
          </div>
          {/* Remove button */}
          {photoPreview && (
            <button
              type="button"
              onClick={handleRemovePhoto}
              className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center transition-colors hover:opacity-80"
              style={{ background: '#ef4444', border: '2px solid #0a1a0f' }}
            >
              <X size={11} color="white" />
            </button>
          )}
        </div>

        {/* Info + buttons */}
        <div className="flex-1 text-center sm:text-left space-y-3">
          <div>
            <h4 className="text-2xl font-semibold mb-1" style={{ color: 'var(--text)' }}>
              Imagem de Identificação
            </h4>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-3)', maxWidth: 400 }}>
              JPG, PNG, WebP, HEIC, GIF — máx. {MAX_SIZE_MB}MB. A foto será recortada em círculo.
            </p>
          </div>

          {photoError && (
            <p className="text-xs flex items-center gap-1.5" style={{ color: 'var(--danger, #ef4444)' }}>
              <AlertTriangle size={12} /> {photoError}
            </p>
          )}

          <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
            {/* Upload from device */}
            <label className="cursor-pointer">
              <span
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all hover:opacity-80"
                style={{ border: '1px solid rgba(0,200,83,0.35)', color: '#3fe56c' }}
              >
                <Upload size={13} /> Escolher arquivo
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/gif,image/bmp"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </label>

            {/* Camera — mobile: abre câmera nativa / desktop: abre webcam */}
            {isMobile ? (
              <label className="cursor-pointer">
                <span
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all hover:opacity-80"
                  style={{ background: 'rgba(0,200,83,0.08)', border: '1px solid rgba(0,200,83,0.2)', color: 'var(--text-2, #a0c4a8)' }}
                >
                  <Camera size={13} /> Câmera
                </span>
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="user"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </label>
            ) : (
              <button
                type="button"
                onClick={() => setShowWebcam(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all hover:opacity-80"
                style={{ background: 'rgba(0,200,83,0.08)', border: '1px solid rgba(0,200,83,0.2)', color: 'var(--text-2, #a0c4a8)' }}
              >
                <Camera size={13} /> Câmera
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* ── 2. Grid: Dados Pessoais + Linha do Tempo Acadêmica ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Dados Pessoais */}
        <Card className="space-y-4">
          <CardTitle>Dados Pessoais</CardTitle>

          <Field label="Nome Completo" error={errors.full_name?.message}>
            <Input {...register('full_name')} placeholder="ex: Alan Turing" />
          </Field>

          <Field label="Apelido" error={errors.nickname?.message}>
            <Input {...register('nickname')} placeholder="Como prefere ser chamado" />
          </Field>

          <Field label="Endereço de E-mail" error={errors.email?.message}>
            <Input {...register('email')} type="email" placeholder="estagiario@chronoslab.com" />
          </Field>
        </Card>

        {/* Linha do Tempo Acadêmica */}
        <Card className="space-y-4">
          <CardTitle>Linha do Tempo Acadêmica</CardTitle>

          <Field label="Curso de Graduação" error={errors.course?.message}>
            <Controller
              name="course"
              control={control}
              render={({ field }) => <CourseSelect value={field.value ?? ''} onChange={field.onChange} />}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Data de Início" error={errors.internship_start?.message}>
              <Controller
                name="internship_start"
                control={control}
                render={({ field }) => (
                  <DatePicker value={field.value ?? ''} onChange={field.onChange} placeholder="mm/dd/yyyy" />
                )}
              />
            </Field>
            <Field label="Data de Término" error={errors.internship_end?.message}>
              <Controller
                name="internship_end"
                control={control}
                render={({ field }) => (
                  <DatePicker value={field.value ?? ''} onChange={field.onChange} placeholder="mm/dd/yyyy" />
                )}
              />
            </Field>
          </div>
        </Card>
      </div>

      {/* ── 3. Grid: Preferências + Segurança ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Preferências do Sistema — col-span-2 */}
        <Card className="md:col-span-2 space-y-4">
          <CardTitle>Preferências do Sistema</CardTitle>

          {/* Estagiário Ativo */}
          <div
            className="flex items-center justify-between p-4 rounded-lg"
            style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(0,200,83,0.12)' }}
          >
            <div className="flex items-center gap-4">
              <CheckCircle2 size={20} style={{ color: '#00c853', flexShrink: 0 }} />
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>Estagiário Ativo</p>
                <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                  Habilitar acesso aos instrumentos e logs do laboratório
                </p>
              </div>
            </div>
            <Controller
              name="is_active"
              control={control}
              render={({ field }) => (
                <Toggle checked={field.value} onChange={field.onChange} />
              )}
            />
          </div>

          {/* Isento de Geolocalização */}
          <div
            className="flex items-center justify-between p-4 rounded-lg"
            style={{
              background: geoExempt ? 'rgba(249,115,22,0.08)' : 'rgba(0,0,0,0.2)',
              border: geoExempt ? '1px solid rgba(249,115,22,0.25)' : '1px solid rgba(0,200,83,0.12)',
              transition: 'all 0.2s',
            }}
          >
            <div className="flex items-center gap-4">
              <MapPinOff size={20} style={{ color: geoExempt ? '#f97316' : 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>Isento de Geolocalização</p>
                <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                  {geoExempt
                    ? 'Ponto liberado sem validação de distância do laboratório'
                    : 'Validação de localização aplicada normalmente'}
                </p>
              </div>
            </div>
            <Controller
              name="geo_exempt"
              control={control}
              render={({ field }) => (
                <Toggle checked={field.value} onChange={field.onChange} />
              )}
            />
          </div>

        </Card>

        {/* Segurança — col-span-1 */}
        <Card className="flex flex-col justify-between">
          <div>
            <CardTitle>Segurança</CardTitle>
            <p className="text-xs mb-6" style={{ color: 'var(--text-3)' }}>
              Gerenciar credenciais de login e chaves de acesso ao sistema.
            </p>
          </div>

          {mode === 'edit' && intern ? (
            <SecurityButtons internId={intern.id} />
          ) : (
            <div className="space-y-3">
              <button
                type="button"
                disabled
                className="w-full py-2.5 rounded-lg text-[11px] font-bold tracking-wider flex items-center justify-center gap-2 opacity-40 cursor-not-allowed"
                style={{ background: 'var(--bg)', border: '1px solid rgba(0,200,83,0.3)', color: '#3fe56c' }}
              >
                <RotateCcw size={13} /> DEFINIR SENHA
              </button>
              <p className="text-[10px] text-center" style={{ color: 'var(--text-3)' }}>
                Disponível após o cadastro
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* ── 4. Footer ── */}
      <div
        className="pt-6 flex items-center justify-end gap-4"
        style={{ borderTop: '1px solid rgba(0,200,83,0.12)' }}
      >
        <button
          type="button"
          onClick={() => router.back()}
          className="px-8 py-3 rounded-lg text-sm font-medium transition-colors hover:opacity-70"
          style={{ color: 'var(--text-3)' }}
        >
          Cancelar
        </button>
        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 px-10 py-3 rounded-lg font-bold text-sm disabled:opacity-50 transition-all"
          style={{ background: '#3fe56c', color: '#003912', boxShadow: '0 4px 16px rgba(63,229,108,0.30)' }}
        >
          {loading
            ? <><Loader2 size={14} className="animate-spin" /> Salvando...</>
            : <><Save size={15} /> {mode === 'create' ? 'Salvar Perfil' : 'Salvar Perfil'}</>
          }
        </motion.button>
      </div>
    </form>
  )
}

/* ── Botões de segurança (modo edição) ─────────────────── */
function SecurityButtons({ internId }: { internId: string }) {
  const [mode,    setMode]    = useState<'idle' | 'manual'>('idle')
  const [pwd,     setPwd]     = useState('')
  const [confirm, setConfirm] = useState('')
  const [status,  setStatus]  = useState<'idle' | 'loading' | 'ok' | 'err'>('idle')
  const [msg,     setMsg]     = useState('')

  const submit = async () => {
    if (mode === 'manual' && pwd !== confirm) { setMsg('Senhas não coincidem.'); setStatus('err'); return }
    setStatus('loading')
    const res  = await fetch('/api/admin/reset-intern-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        intern_id: internId,
        action: 'set_password',
        new_password: mode === 'manual' ? pwd : undefined,
      }),
    })
    const json = await res.json()
    if (res.ok) {
      setStatus('ok'); setMsg(json.message || 'Concluído!')
      setPwd(''); setConfirm('')
      setTimeout(() => { setStatus('idle'); setMode('idle'); setMsg('') }, 3000)
    } else {
      setStatus('err'); setMsg(json.error || 'Erro. Tente novamente.')
    }
  }

  if (status === 'ok') return (
    <div className="flex items-center gap-2 text-xs px-3 py-2.5 rounded-xl"
      style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)', color: 'var(--success)' }}>
      <CheckCircle2 size={13} /> {msg}
    </div>
  )

  if (mode === 'idle') return (
    <div className="space-y-3">
      <button type="button" onClick={() => setMode('manual')}
        className="w-full py-2.5 rounded-lg text-[11px] font-bold tracking-wider flex items-center justify-center gap-2 transition-all hover:opacity-80"
        style={{ background: 'var(--bg)', border: '1px solid rgba(0,200,83,0.3)', color: '#3fe56c' }}>
        <RotateCcw size={13} /> DEFINIR SENHA
      </button>
    </div>
  )


  return (
    <div className="space-y-2">
      {status === 'err' && (
        <p className="text-[10px]" style={{ color: 'var(--danger)' }}>{msg}</p>
      )}
      <input type="password" value={pwd} onChange={e => setPwd(e.target.value)}
        placeholder="Nova senha (mín. 6 chars)"
        className="w-full px-3 py-2 rounded-lg text-xs focus:outline-none"
        style={{ background: 'var(--bg)', border: '1px solid rgba(0,200,83,0.20)', color: 'var(--text)' }} />
      <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
        placeholder="Confirmar senha"
        className="w-full px-3 py-2 rounded-lg text-xs focus:outline-none"
        style={{ background: 'var(--bg)', border: '1px solid rgba(0,200,83,0.20)', color: 'var(--text)' }} />
      <div className="flex gap-2">
        <button type="button" onClick={() => { setMode('idle'); setPwd(''); setConfirm('') }}
          className="flex-1 py-2 rounded-lg text-[10px] font-bold"
          style={{ border: '1px solid rgba(0,200,83,0.15)', color: 'var(--text-3)' }}>
          Cancelar
        </button>
        <button type="button" onClick={submit}
          disabled={status === 'loading' || pwd.length < 6 || pwd !== confirm}
          className="flex-1 py-2 rounded-lg text-[10px] font-bold disabled:opacity-40"
          style={{ background: '#3fe56c', color: '#003912' }}>
          {status === 'loading' ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </div>
  )
}
