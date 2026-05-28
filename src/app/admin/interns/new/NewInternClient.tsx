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
import CourseSelect from '@/components/ui/CourseSelect'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

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

  const inp = "w-full px-3 py-2 rounded-xl text-sm outline-none font-medium transition-all"
  const inpStyle = { background: 'var(--bg)', border: '1.5px solid var(--border)', color: 'var(--text)' }
  const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) =>
    (e.target.style.borderColor = 'var(--primary)')
  const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) =>
    (e.target.style.borderColor = 'var(--border)')

  const Label = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
    <label className="flex items-center gap-1 text-[10px] font-bold mb-1" style={{ color: 'var(--text-2)' }}>
      {icon} {text}
    </label>
  )

  const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="rounded-2xl p-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <p className="text-[9px] font-black mb-2 tracking-widest" style={{ color: 'var(--text-3)' }}>{title}</p>
      {children}
    </div>
  )

  return (
    /* Outer: fills the content area from layout */
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden', background: 'var(--bg)' }}>

      {/* ── TopAppBar ── */}
      <header
        className="flex items-center gap-4 px-6 h-16 flex-shrink-0"
        style={{ background: 'var(--bg)', borderBottom: '1px solid rgba(0,200,83,0.15)' }}
      >
        <Link
          href="/admin/interns"
          className="flex items-center justify-center w-9 h-9 rounded-lg transition-colors"
          style={{ background: 'var(--surface-card, #0f2318)', border: '1px solid rgba(0,200,83,0.15)', color: 'var(--text-3)' }}
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>Estagiários</p>
          <h2 className="text-base font-semibold leading-none" style={{ color: 'var(--text)' }}>
            Novo Estagiário
          </h2>
        </div>
      </header>

      {/* ── Body ──
          Mobile  → scroll vertical normal
          Desktop → overflow hidden, grid de 3 colunas sem scroll  */}
      <div
        className="flex-1 min-h-0 overflow-y-auto md:overflow-hidden no-scrollbar"
        style={{ display: 'flex', flexDirection: 'column' }}
      >
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="max-w-screen-xl mx-auto px-4 sm:px-6 py-3
                     flex flex-col gap-3
                     md:grid md:gap-3"
          style={{
            flex: 1,
            minHeight: 0,
            width: '100%',
            /* 3 colunas: foto estreita | dados pessoais larga | config+período média */
            gridTemplateColumns: '180px 1fr 210px',
            gridTemplateRows: 'minmax(0, 1fr) auto',
          }}
        >

          {/* ══════════════════════════════════════════
              COLUNA 1 — Foto de perfil
              ══════════════════════════════════════════ */}
          <div className="flex flex-col gap-2 md:row-span-2">

            {/* Alertas */}
            <AnimatePresence>
              {error && (
                <motion.div key="err"
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="flex items-start gap-2 px-3 py-2 rounded-xl text-[11px]"
                  style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--danger)' }}
                >
                  <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" /> {error}
                </motion.div>
              )}
              {success && (
                <motion.div key="ok"
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-[11px]"
                  style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)', color: 'var(--success)' }}
                >
                  <CheckCircle2 size={12} /> Cadastrado! Redirecionando…
                </motion.div>
              )}
            </AnimatePresence>

            <Card title="Foto de Perfil">
              <div className="flex flex-col items-center gap-2">
                <motion.div
                  whileHover={{ scale: 1.04 }}
                  className="relative w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center cursor-pointer"
                  style={{ background: 'var(--bg)', border: photoPreview ? '2px solid var(--primary)' : '2px dashed var(--border)' }}
                >
                  {photoPreview
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    : <Camera size={22} style={{ color: 'var(--text-3)', opacity: 0.4 }} />
                  }
                  <label className="absolute inset-0 cursor-pointer">
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                  </label>
                </motion.div>
                <p className="text-[10px] font-bold" style={{ color: 'var(--primary)' }}>
                  {photoPreview ? 'Trocar foto' : 'Adicionar foto'}
                </p>
              </div>
            </Card>
          </div>

          {/* ══════════════════════════════════════════
              COLUNA 2 — Dados pessoais (linha 1)
              ══════════════════════════════════════════ */}
          <div className="flex flex-col gap-2 min-w-0">
            <Card title="Dados Pessoais">
              <div className="space-y-2">

                {/* Nome completo */}
                <div>
                  <Label icon={<User size={9} />} text="NOME COMPLETO *" />
                  <input {...register('full_name')} type="text" placeholder="Ex: Miltão Rei da Galáxia"
                    className={inp} style={inpStyle} onFocus={onFocus} onBlur={onBlur} />
                  {errors.full_name && <p className="text-[10px] mt-0.5" style={{ color: 'var(--danger)' }}>{errors.full_name.message}</p>}
                </div>

                {/* Apelido + E-mail */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label icon={<Tag size={9} />} text="APELIDO" />
                    <input {...register('nickname')} type="text" placeholder="Ex: Miltinho"
                      className={inp} style={inpStyle} onFocus={onFocus} onBlur={onBlur} />
                  </div>
                  <div>
                    <Label icon={<Mail size={9} />} text="E-MAIL *" />
                    <input {...register('email')} type="email" placeholder="Ex: milton@exemplo.com"
                      className={inp} style={inpStyle} onFocus={onFocus} onBlur={onBlur} />
                    {errors.email && <p className="text-[10px] mt-0.5" style={{ color: 'var(--danger)' }}>{errors.email.message}</p>}
                  </div>
                </div>

                {/* Graduação */}
                <div>
                  <Label icon={<GraduationCap size={9} />} text="GRADUAÇÃO" />
                  <Controller
                    name="course"
                    control={control}
                    render={({ field }) => (
                      <CourseSelect value={field.value ?? ''} onChange={field.onChange} />
                    )}
                  />
                </div>

              </div>
            </Card>
          </div>

          {/* ══════════════════════════════════════════
              COLUNA 3 — Config + Período (linha 1)
              ══════════════════════════════════════════ */}
          <div className="flex flex-col gap-2">

            <Card title="Configurações">
              <div className="space-y-2">
                <label htmlFor="is_active" className="flex items-center gap-2.5 cursor-pointer">
                  <input {...register('is_active')} type="checkbox" id="is_active" className="w-4 h-4 rounded accent-green-600 flex-shrink-0" />
                  <div className="flex items-center gap-1.5">
                    <ToggleRight size={13} style={{ color: 'var(--success)' }} />
                    <div>
                      <p className="text-xs font-bold leading-none" style={{ color: 'var(--text)' }}>Estagiário ativo</p>
                      <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-3)' }}>Pode registrar ponto</p>
                    </div>
                  </div>
                </label>
                <label htmlFor="notify_email" className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" id="notify_email" checked={notifyEmail}
                    onChange={e => setNotifyEmail(e.target.checked)}
                    className="w-4 h-4 rounded accent-green-600 flex-shrink-0" />
                  <div className="flex items-center gap-1.5">
                    <Bell size={13} style={{ color: 'var(--info)' }} />
                    <div>
                      <p className="text-xs font-bold leading-none" style={{ color: 'var(--text)' }}>Lembretes por e-mail</p>
                      <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-3)' }}>Notificações de ponto</p>
                    </div>
                  </div>
                </label>
              </div>
            </Card>

            <Card title="Período do Estágio">
              <div className="space-y-2">
                {[
                  { name: 'internship_start' as const, label: 'INÍCIO' },
                  { name: 'internship_end' as const,   label: 'TÉRMINO' },
                ].map(f => (
                  <div key={f.name}>
                    <Label icon={<Calendar size={9} />} text={f.label} />
                    <Controller
                      name={f.name}
                      control={control}
                      render={({ field }) => (
                        <DatePicker value={field.value ?? ''} onChange={field.onChange}
                          placeholder={`Selecionar ${f.label.toLowerCase()}`} />
                      )}
                    />
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* ══════════════════════════════════════════
              Linha 2 — Botões (colunas 2 e 3)
              ══════════════════════════════════════════ */}
          <div className="flex gap-3 md:col-span-2 md:col-start-2">
            <motion.button
              type="button" onClick={() => router.back()}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              className="flex-1 py-2.5 rounded-2xl text-sm font-bold"
              style={{ border: '1.5px solid var(--border)', color: 'var(--text-2)', background: 'var(--bg)' }}
            >
              Cancelar
            </motion.button>
            <motion.button
              type="submit" disabled={loading || success}
              whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.97 }}
              className="flex-1 py-2.5 rounded-2xl text-sm font-black text-white disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: 'var(--primary)', boxShadow: '0 4px 18px rgba(30,92,45,0.4)' }}
            >
              {loading
                ? <><Loader2 size={14} className="animate-spin" /> Salvando…</>
                : success
                ? <><CheckCircle2 size={14} /> Cadastrado!</>
                : 'Cadastrar Estagiário'
              }
            </motion.button>
          </div>

        </form>
      </div>
    </div>
  )
}
