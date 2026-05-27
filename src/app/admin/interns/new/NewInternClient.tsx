'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import {
  CheckCircle2, AlertTriangle, Loader2, Camera,
  ChevronDown, GraduationCap, User, Mail, Tag, Calendar,
  ToggleRight, Bell,
} from 'lucide-react'
import { internSchema, type InternInput } from '@/lib/validations'
import DatePicker from '@/components/ui/DatePicker'
import BackButton from '@/components/ui/BackButton'

export default function NewInternClient() {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [notifyEmail, setNotifyEmail] = useState(false)

  const { register, handleSubmit, control, formState: { errors } } = useForm<InternInput>({
    resolver: zodResolver(internSchema),
    defaultValues: { is_active: true },
  })

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const onSubmit = async (data: InternInput) => {
    setLoading(true)
    setError(null)

    let photoUrl: string | null = null
    if (photoFile) {
      const ext = photoFile.name.split('.').pop()
      const path = `avatars/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, photoFile, { upsert: true })
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
        photoUrl = urlData.publicUrl
      }
    }

    const res = await fetch('/api/admin/create-intern', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, nickname: data.nickname || null, photo_url: photoUrl }),
    })
    const json = await res.json()
    if (!res.ok) {
      setError(json.error ?? 'Erro ao cadastrar.')
      setLoading(false)
      return
    }
    setSuccess(true)
    setTimeout(() => router.push('/admin/interns'), 1400)
    setLoading(false)
  }

  const inputCls = "w-full px-3 py-2.5 rounded-xl text-sm outline-none font-medium transition-all"
  const inputStyle = { background: 'var(--bg)', border: '1.5px solid var(--border)', color: 'var(--text)' }
  const focusBorder = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) =>
    (e.target.style.borderColor = 'var(--primary)')
  const blurBorder = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) =>
    (e.target.style.borderColor = 'var(--border)')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden', background: 'var(--bg)' }}>

      {/* ── Header ── */}
      <div className="flex-shrink-0" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <BackButton href="/admin/interns" />
          <div className="w-px h-4 flex-shrink-0" style={{ background: 'var(--border)' }} />
          <div>
            <h1 className="font-black text-sm tracking-wide" style={{ color: 'var(--text)' }}>CADASTRAR ESTAGIÁRIO</h1>
            <p className="text-[10px]" style={{ color: 'var(--text-3)' }}>PREENCHA OS DADOS DO NOVO MEMBRO</p>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      {/* Mobile: scrollable. Desktop: fits full height, no scroll */}
      <div
        className="flex-1 min-h-0 overflow-y-auto md:overflow-hidden no-scrollbar"
      >
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="h-full max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col md:flex-row gap-4"
        >

          {/* ── LEFT COLUMN (desktop) / top section (mobile) ── */}
          <div className="flex flex-col gap-3 md:w-64 md:flex-shrink-0">

            {/* Alerts */}
            <AnimatePresence>
              {error && (
                <motion.div
                  key="err"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-start gap-2 px-3 py-2.5 rounded-xl text-xs"
                  style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--danger)' }}
                >
                  <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" /> {error}
                </motion.div>
              )}
              {success && (
                <motion.div
                  key="ok"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs"
                  style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)', color: 'var(--success)' }}
                >
                  <CheckCircle2 size={13} /> Cadastrado! Redirecionando…
                </motion.div>
              )}
            </AnimatePresence>

            {/* Foto */}
            <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <p className="text-[10px] font-black mb-3 tracking-wider" style={{ color: 'var(--text-3)' }}>FOTO DE PERFIL</p>
              <div className="flex flex-col items-center gap-3">
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  className="relative w-24 h-24 rounded-2xl overflow-hidden flex items-center justify-center cursor-pointer"
                  style={{ background: 'var(--bg)', border: photoPreview ? '2px solid var(--primary)' : '2px dashed var(--border)' }}
                >
                  {photoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Camera size={26} style={{ color: 'var(--text-3)', opacity: 0.4 }} />
                  )}
                  <label className="absolute inset-0 cursor-pointer">
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                  </label>
                </motion.div>
                <p className="text-[11px] font-bold" style={{ color: 'var(--primary)' }}>
                  {photoPreview ? 'TROCAR FOTO' : 'ADICIONAR FOTO'}
                </p>
              </div>
            </div>

            {/* Status + Notificação */}
            <div className="rounded-2xl p-4 space-y-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <p className="text-[10px] font-black tracking-wider" style={{ color: 'var(--text-3)' }}>CONFIGURAÇÕES</p>
              {[
                { id: 'is_active', label: 'Estagiário ativo', sub: 'Pode registrar ponto', reg: register('is_active'), icon: <ToggleRight size={15} style={{ color: 'var(--success)' }} /> },
              ].map(item => (
                <label key={item.id} htmlFor={item.id} className="flex items-center gap-3 cursor-pointer group">
                  <input {...item.reg} type="checkbox" id={item.id} className="w-4 h-4 rounded accent-green-600 flex-shrink-0" />
                  <div className="flex items-center gap-2 flex-1">
                    {item.icon}
                    <div>
                      <p className="text-xs font-bold" style={{ color: 'var(--text)' }}>{item.label}</p>
                      <p className="text-[10px]" style={{ color: 'var(--text-3)' }}>{item.sub}</p>
                    </div>
                  </div>
                </label>
              ))}
              <label htmlFor="notify_email" className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox" id="notify_email" checked={notifyEmail}
                  onChange={e => setNotifyEmail(e.target.checked)}
                  className="w-4 h-4 rounded accent-green-600 flex-shrink-0"
                />
                <div className="flex items-center gap-2 flex-1">
                  <Bell size={15} style={{ color: 'var(--info)' }} />
                  <div>
                    <p className="text-xs font-bold" style={{ color: 'var(--text)' }}>Lembretes por e-mail</p>
                    <p className="text-[10px]" style={{ color: 'var(--text-3)' }}>Notificações de ponto</p>
                  </div>
                </div>
              </label>
            </div>

            {/* Período */}
            <div className="rounded-2xl p-4 space-y-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <p className="text-[10px] font-black tracking-wider" style={{ color: 'var(--text-3)' }}>PERÍODO DO ESTÁGIO</p>
              {[
                { name: 'internship_start' as const, label: 'INÍCIO', icon: <Calendar size={10} /> },
                { name: 'internship_end' as const, label: 'TÉRMINO', icon: <Calendar size={10} /> },
              ].map(f => (
                <div key={f.name}>
                  <label className="flex items-center gap-1 text-[10px] font-bold mb-1.5" style={{ color: 'var(--text-2)' }}>
                    {f.icon} {f.label}
                  </label>
                  <Controller
                    name={f.name}
                    control={control}
                    render={({ field }) => (
                      <DatePicker value={field.value ?? ''} onChange={field.onChange} placeholder={`Selecionar ${f.label.toLowerCase()}`} />
                    )}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT COLUMN (desktop) / bottom section (mobile) ── */}
          <div className="flex flex-col gap-3 flex-1 min-w-0">

            {/* Dados pessoais */}
            <div className="rounded-2xl p-4 space-y-3 flex-1" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <p className="text-[10px] font-black tracking-wider" style={{ color: 'var(--text-3)' }}>DADOS PESSOAIS</p>

              {/* Nome */}
              <div>
                <label className="flex items-center gap-1 text-[10px] font-bold mb-1.5" style={{ color: 'var(--text-2)' }}>
                  <User size={10} /> NOME COMPLETO *
                </label>
                <input {...register('full_name')} type="text" placeholder="Ex: Miltão Rei da Galáxia"
                  className={inputCls} style={inputStyle} onFocus={focusBorder} onBlur={blurBorder} />
                {errors.full_name && <p className="text-[10px] mt-1" style={{ color: 'var(--danger)' }}>{errors.full_name.message}</p>}
              </div>

              {/* Apelido + Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-1 text-[10px] font-bold mb-1.5" style={{ color: 'var(--text-2)' }}>
                    <Tag size={10} /> APELIDO
                  </label>
                  <input {...register('nickname')} type="text" placeholder="Ex: Miltinho"
                    className={inputCls} style={inputStyle} onFocus={focusBorder} onBlur={blurBorder} />
                </div>
                <div>
                  <label className="flex items-center gap-1 text-[10px] font-bold mb-1.5" style={{ color: 'var(--text-2)' }}>
                    <Mail size={10} /> E-MAIL *
                  </label>
                  <input {...register('email')} type="email" placeholder="Ex: milton@exemplo.com"
                    className={inputCls} style={inputStyle} onFocus={focusBorder} onBlur={blurBorder} />
                  {errors.email && <p className="text-[10px] mt-1" style={{ color: 'var(--danger)' }}>{errors.email.message}</p>}
                </div>
              </div>

              {/* Graduação */}
              <div>
                <label className="flex items-center gap-1 text-[10px] font-bold mb-1.5" style={{ color: 'var(--text-2)' }}>
                  <GraduationCap size={10} /> GRADUAÇÃO
                </label>
                <div className="relative">
                  <select
                    {...register('course')}
                    className={`${inputCls} appearance-none cursor-pointer pr-10`}
                    style={inputStyle}
                    onFocus={focusBorder as React.FocusEventHandler<HTMLSelectElement>}
                    onBlur={blurBorder as React.FocusEventHandler<HTMLSelectElement>}
                  >
                    <option value="">Selecione o curso</option>
                    <option value="BACHARELADO EM AGRONOMIA">BACHARELADO EM AGRONOMIA</option>
                    <option value="TÉCNICO EM AGROPECUÁRIA">TÉCNICO EM AGROPECUÁRIA</option>
                    <option value="LICENCIATURA EM CIÊNCIAS BIOLÓGICAS">LICENCIATURA EM CIÊNCIAS BIOLÓGICAS</option>
                    <option value="MESTRADO EM PROTEÇÃO DE PLANTAS">MESTRADO EM PROTEÇÃO DE PLANTAS</option>
                    <option value="TÉCNICO EM BIOTECNOLOGIA">TÉCNICO EM BIOTECNOLOGIA</option>
                    <option value="CONSERVAÇÃO DOS RECURSOS NATURAIS DO CERRADO">CONSERVAÇÃO DOS RECURSOS NATURAIS DO CERRADO</option>
                  </select>
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(30,92,45,0.12)' }}>
                    <ChevronDown size={12} style={{ color: 'var(--primary)' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Botões de ação */}
            <div className="flex gap-3">
              <motion.button
                type="button"
                onClick={() => router.back()}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="flex-1 py-3 rounded-2xl text-sm font-bold"
                style={{ border: '1.5px solid var(--border)', color: 'var(--text-2)', background: 'var(--bg)' }}
              >
                CANCELAR
              </motion.button>
              <motion.button
                type="submit"
                disabled={loading || success}
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.97 }}
                className="flex-1 py-3 rounded-2xl text-sm font-black text-white disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: 'var(--primary)', boxShadow: '0 4px 18px rgba(30,92,45,0.4)' }}
              >
                {loading
                  ? <><Loader2 size={14} className="animate-spin" /> SALVANDO…</>
                  : success
                  ? <><CheckCircle2 size={14} /> CADASTRADO!</>
                  : 'CADASTRAR ESTAGIÁRIO'
                }
              </motion.button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
