'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Tag, Mail, Camera, Check, Loader2, AlertCircle, CheckCircle2, Lock, Eye, EyeOff } from 'lucide-react'
import CourseSelect from '@/components/ui/CourseSelect'

interface ProfileData {
  full_name: string
  nickname: string | null
  email: string
  course: string | null
  photo_url: string | null
}

const inputCls = 'w-full pl-10 pr-4 py-2.5 rounded-xl font-medium outline-none transition-all'
const inputStyle = {
  background: 'rgba(0,0,0,0.25)',
  border: '1px solid rgba(0,200,83,0.18)',
  color: '#d4e8d5',
  fontSize: '16px',
}

export default function ProfileForm({ initial }: { initial: ProfileData }) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [fullName, setFullName] = useState(initial.full_name)
  const [nickname, setNickname] = useState(initial.nickname ?? '')
  const [course, setCourse] = useState(initial.course ?? '')
  const [photoPreview, setPhotoPreview] = useState<string | null>(initial.photo_url)
  const [photoBase64, setPhotoBase64] = useState<string | null>(null)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Alterar senha
  const [pwdCurrent, setPwdCurrent]   = useState('')
  const [pwdNew, setPwdNew]           = useState('')
  const [pwdConfirm, setPwdConfirm]   = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew]         = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pwdSaving, setPwdSaving]     = useState(false)
  const [pwdError, setPwdError]       = useState<string | null>(null)
  const [pwdSuccess, setPwdSuccess]   = useState(false)

  const handlePhotoPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const img = new window.Image()
      img.onload = () => {
        // Recorta quadrado central e redimensiona
        const canvas = document.createElement('canvas')
        const size = Math.min(img.width, img.height)
        const target = 480
        canvas.width = target
        canvas.height = target
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, (img.width - size) / 2, (img.height - size) / 2, size, size, 0, 0, target, target)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
        setPhotoPreview(dataUrl)
        setPhotoBase64(dataUrl.split(',')[1])
      }
      img.src = ev.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const save = async () => {
    setError(null)
    if (fullName.trim().split(' ').filter(Boolean).length < 2) {
      return setError('Informe o nome completo (nome e sobrenome).')
    }
    setSaving(true)
    try {
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          nickname: nickname || null,
          course: course || null,
          photo_base64: photoBase64,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro ao salvar')
      setSuccess(true)
      setPhotoBase64(null)
      setTimeout(() => {
        setSuccess(false)
        router.refresh()
      }, 1500)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const savePassword = async () => {
    setPwdError(null)
    if (pwdNew.length < 6) { setPwdError('A nova senha deve ter pelo menos 6 caracteres.'); return }
    if (pwdNew !== pwdConfirm) { setPwdError('As senhas não coincidem.'); return }
    setPwdSaving(true)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: pwdCurrent, new_password: pwdNew }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro ao alterar senha.')
      setPwdSuccess(true)
      setPwdCurrent(''); setPwdNew(''); setPwdConfirm('')
      setTimeout(() => setPwdSuccess(false), 3000)
    } catch (e) {
      setPwdError(e instanceof Error ? e.message : 'Erro ao alterar senha.')
    } finally {
      setPwdSaving(false)
    }
  }

  const initial1 = (fullName.trim().charAt(0) || 'E').toUpperCase()

  return (
    <div className="space-y-5">
      {/* Foto */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          {photoPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoPreview} alt="Foto" className="w-24 h-24 rounded-full object-cover"
              style={{ border: '3px solid rgba(0,200,83,0.4)' }} />
          ) : (
            <div className="w-24 h-24 rounded-full flex items-center justify-center font-black text-3xl"
              style={{ background: 'rgba(0,200,83,0.18)', border: '3px solid rgba(0,200,83,0.4)', color: '#3fe56c' }}>
              {initial1}
            </div>
          )}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: '#00c853', border: '2px solid #07170c' }}
          >
            <Camera size={15} color="#003912" />
          </button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" capture="user" className="hidden" onChange={handlePhotoPick} />
        <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>Toque na câmera para alterar a foto</p>
      </div>

      {/* Nome */}
      <div>
        <label className="block text-[10px] font-bold tracking-widest mb-1.5" style={{ color: 'rgba(63,229,108,0.7)' }}>
          NOME COMPLETO
        </label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'rgba(0,200,83,0.5)' }}><User size={15} /></span>
          <input value={fullName} onChange={e => setFullName(e.target.value)} className={inputCls} style={inputStyle} placeholder="Ex: Maria Silva" />
        </div>
      </div>

      {/* Apelido */}
      <div>
        <label className="block text-[10px] font-bold tracking-widest mb-1.5" style={{ color: 'rgba(63,229,108,0.7)' }}>
          APELIDO (OPCIONAL)
        </label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'rgba(0,200,83,0.5)' }}><Tag size={15} /></span>
          <input value={nickname} onChange={e => setNickname(e.target.value)} className={inputCls} style={inputStyle} placeholder="Como te chamam" />
        </div>
      </div>

      {/* E-mail (somente leitura) */}
      <div>
        <label className="block text-[10px] font-bold tracking-widest mb-1.5" style={{ color: 'rgba(63,229,108,0.7)' }}>
          E-MAIL
        </label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'rgba(0,200,83,0.5)' }}><Mail size={15} /></span>
          <input value={initial.email} readOnly disabled className={inputCls}
            style={{ ...inputStyle, opacity: 0.6, cursor: 'not-allowed' }} />
        </div>
        <p className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Para alterar o e-mail de acesso, fale com o administrador.
        </p>
      </div>

      {/* Curso */}
      <div>
        <label className="block text-[10px] font-bold tracking-widest mb-1.5" style={{ color: 'rgba(63,229,108,0.7)' }}>
          CURSO DE GRADUAÇÃO
        </label>
        <CourseSelect value={course} onChange={setCourse} />
      </div>

      {/* ── Alterar Senha ── */}
      <div className="pt-2">
        <div className="rounded-xl p-4 space-y-3" style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(0,200,83,0.15)' }}>
          <div className="flex items-center gap-2 mb-1">
            <Lock size={14} style={{ color: '#3fe56c' }} />
            <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: '#3fe56c' }}>Alterar Senha</span>
          </div>

          {/* Senha atual */}
          {[
            { label: 'SENHA ATUAL', value: pwdCurrent, setter: setPwdCurrent, show: showCurrent, toggle: () => setShowCurrent(v => !v) },
            { label: 'NOVA SENHA', value: pwdNew, setter: setPwdNew, show: showNew, toggle: () => setShowNew(v => !v) },
            { label: 'CONFIRMAR NOVA SENHA', value: pwdConfirm, setter: setPwdConfirm, show: showConfirm, toggle: () => setShowConfirm(v => !v) },
          ].map(({ label, value, setter, show, toggle }) => (
            <div key={label}>
              <label className="block text-[10px] font-bold tracking-widest mb-1.5" style={{ color: 'rgba(63,229,108,0.7)' }}>
                {label}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'rgba(0,200,83,0.5)' }}>
                  <Lock size={14} />
                </span>
                <input
                  type={show ? 'text' : 'password'}
                  value={value}
                  onChange={e => setter(e.target.value)}
                  className={inputCls}
                  style={{ ...inputStyle, paddingRight: 40 }}
                  placeholder="••••••"
                />
                <button
                  type="button"
                  onClick={toggle}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'rgba(0,200,83,0.4)' }}
                >
                  {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          ))}

          <AnimatePresence>
            {pwdError && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-xs flex items-center gap-1.5" style={{ color: '#ff5252' }}>
                <AlertCircle size={12} /> {pwdError}
              </motion.p>
            )}
          </AnimatePresence>

          <motion.button
            type="button"
            onClick={savePassword}
            disabled={pwdSaving || !pwdCurrent || !pwdNew || !pwdConfirm}
            whileTap={{ scale: 0.97 }}
            className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40 transition-all"
            style={{ background: pwdSuccess ? '#16a34a' : 'rgba(0,200,83,0.15)', border: '1px solid rgba(0,200,83,0.3)', color: '#3fe56c' }}
          >
            {pwdSaving ? <><Loader2 size={14} className="animate-spin" /> Alterando...</>
              : pwdSuccess ? <><CheckCircle2 size={14} /> Senha alterada!</>
              : <><Lock size={14} /> Alterar senha</>}
          </motion.button>
        </div>
      </div>

      {/* Erro / sucesso */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="px-4 py-3 rounded-xl flex items-center gap-2 text-sm"
            style={{ background: 'rgba(255,82,82,0.10)', border: '1px solid rgba(255,82,82,0.25)', color: '#ff5252' }}>
            <AlertCircle size={14} /> {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botão salvar */}
      <motion.button
        onClick={save}
        disabled={saving}
        whileTap={{ scale: 0.97 }}
        className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
        style={{ background: success ? '#16a34a' : '#00c853', color: '#003912' }}
      >
        {saving ? <><Loader2 size={15} className="animate-spin" /> Salvando...</>
          : success ? <><CheckCircle2 size={15} /> Salvo!</>
          : <><Check size={15} /> Salvar alterações</>}
      </motion.button>
    </div>
  )
}
