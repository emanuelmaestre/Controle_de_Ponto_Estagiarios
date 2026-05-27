'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { CheckCircle2, AlertTriangle, Loader2, Camera, Key, Mail, Lock, ChevronDown, GraduationCap } from 'lucide-react'
import { internSchema } from '@/lib/validations'
import type { Profile } from '@/types/database'
import DatePicker from '@/components/ui/DatePicker'

type InternFormValues = {
  full_name: string
  email: string
  nickname?: string
  course?: string
  internship_start?: string
  internship_end?: string
  is_active: boolean
}

interface Props {
  mode: 'create' | 'edit'
  intern?: Profile
}

export default function InternForm({ mode, intern }: Props) {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Photo upload state
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(intern?.photo_url ?? null)
  const [notifyEmail, setNotifyEmail] = useState(false)

  const { register, handleSubmit, control, formState: { errors } } = useForm<InternFormValues>({
    resolver: zodResolver(internSchema),
    defaultValues: intern ? {
      full_name: intern.full_name,
      email: intern.email,
      nickname: intern.nickname ?? '',
      course: intern.course ?? '',
      internship_start: intern.internship_start ?? '',
      internship_end: intern.internship_end ?? '',
      is_active: intern.is_active,
    } : {
      is_active: true,
    },
  })

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const onSubmit = async (data: InternFormValues) => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    // Upload photo if selected
    let photoUrl: string | null = intern?.photo_url ?? null
    if (photoFile) {
      const ext = photoFile.name.split('.').pop()
      const path = `avatars/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, photoFile, { upsert: true })
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
        photoUrl = urlData.publicUrl
      }
    }

    if (mode === 'create') {
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
      setSuccess('Estagiário cadastrado! Um e-mail de boas-vindas foi enviado.')
      setTimeout(() => router.push('/admin/interns'), 1500)
    } else if (intern) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          email: data.email,
          nickname: data.nickname || null,
          course: data.course || null,
          internship_start: data.internship_start || null,
          internship_end: data.internship_end || null,
          is_active: data.is_active,
          ...(photoUrl !== null ? { photo_url: photoUrl } : {}),
        })
        .eq('id', intern.id)

      if (updateError) {
        setError('Erro ao salvar alterações.')
      } else {
        setSuccess('Dados atualizados com sucesso!')
        router.refresh()
      }
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <AnimatePresence>
        {error && (
          <motion.div
            key="error"
            initial={{ opacity: 0, height: 0, scale: 0.96 }}
            animate={{ opacity: 1, height: 'auto', scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3"
          >
            <AlertTriangle size={14} className="flex-shrink-0" /> {error}
          </motion.div>
        )}
        {success && (
          <motion.div
            key="success"
            initial={{ opacity: 0, height: 0, scale: 0.96 }}
            animate={{ opacity: 1, height: 'auto', scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3"
          >
            <CheckCircle2 size={14} className="flex-shrink-0" /> {success}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Foto de perfil */}
      <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text)' }}>FOTO DE PERFIL</h3>
        <div className="flex flex-col items-center gap-3">
          <div
            className="relative w-24 h-24 rounded-2xl overflow-hidden flex items-center justify-center"
            style={{ background: 'var(--bg)', border: '2px dashed var(--border)' }}
          >
            {photoPreview ? (
              <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <Camera size={28} style={{ color: 'var(--text-3)', opacity: 0.5 }} />
            )}
          </div>
          <label className="cursor-pointer text-sm font-bold hover:opacity-70 transition-opacity" style={{ color: 'var(--primary)' }}>
            {photoPreview ? 'TROCAR FOTO' : 'ADICIONAR FOTO'}
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </label>
        </div>
      </div>

      {/* Dados Pessoais */}
      <div className="rounded-2xl p-5 space-y-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>DADOS PESSOAIS</h3>

        <div>
          <label className="block text-xs font-bold mb-1" style={{ color: 'var(--text-2)' }}>NOME COMPLETO *</label>
          <input
            {...register('full_name')}
            type="text"
            placeholder="Ex: Miltão Rei da Galáxia"
            className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
          />
          {errors.full_name && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.full_name.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-bold mb-1" style={{ color: 'var(--text-2)' }}>APELIDO</label>
          <input
            {...register('nickname')}
            type="text"
            placeholder="Ex: Miltinho"
            className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
          />
          {errors.nickname && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.nickname.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-bold mb-1" style={{ color: 'var(--text-2)' }}>E-MAIL *</label>
          <input
            {...register('email')}
            type="email"
            placeholder="Ex: milton@exemplo.com"
            className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
          />
          {errors.email && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-bold mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--text-2)' }}>
            <GraduationCap size={12} style={{ color: 'var(--primary)' }} /> CURSO
          </label>
          <div className="relative">
            <select
              {...register('course')}
              className="w-full pl-4 pr-10 py-3 rounded-xl text-sm focus:outline-none appearance-none font-medium transition-all"
              style={{
                background: 'var(--bg)',
                border: '1.5px solid var(--border)',
                color: 'var(--text)',
                boxShadow: 'var(--card-shadow)',
                cursor: 'pointer',
              }}
              onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
              onBlur={e  => (e.target.style.borderColor = 'var(--border)')}
            >
              <option value="" style={{ color: 'var(--text-3)' }}>▾ SELECIONE O CURSO</option>
              <option value="BACHARELADO EM AGRONOMIA">BACHARELADO EM AGRONOMIA</option>
              <option value="TÉCNICO EM AGROPECUÁRIA">TÉCNICO EM AGROPECUÁRIA</option>
              <option value="LICENCIATURA EM CIÊNCIAS BIOLÓGICAS">LICENCIATURA EM CIÊNCIAS BIOLÓGICAS</option>
              <option value="MESTRADO EM PROTEÇÃO DE PLANTAS">MESTRADO EM PROTEÇÃO DE PLANTAS</option>
              <option value="TÉCNICO EM BIOTECNOLOGIA">TÉCNICO EM BIOTECNOLOGIA</option>
            </select>
            {/* Custom chevron arrow */}
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded-lg"
              style={{ background: 'rgba(30,92,45,0.12)' }}>
              <ChevronDown size={13} style={{ color: 'var(--primary)' }} />
            </div>
          </div>
          {errors.course && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.course.message}</p>}
        </div>
      </div>

      {/* Período do estágio */}
      <div className="rounded-2xl p-5 space-y-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>PERÍODO DO ESTÁGIO</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--text-2)' }}>DATA DE INÍCIO</label>
            <Controller
              name="internship_start"
              control={control}
              render={({ field }) => (
                <DatePicker
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  placeholder="Selecionar início"
                />
              )}
            />
            {errors.internship_start && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.internship_start.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--text-2)' }}>DATA DE TÉRMINO</label>
            <Controller
              name="internship_end"
              control={control}
              render={({ field }) => (
                <DatePicker
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  placeholder="Selecionar término"
                />
              )}
            />
            {errors.internship_end && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors.internship_end.message}</p>}
          </div>
        </div>
      </div>

      {/* Configurações */}
      <div className="rounded-2xl p-5 space-y-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>CONFIGURAÇÕES</h3>

        <div className="flex items-center gap-3">
          <input
            {...register('is_active')}
            type="checkbox"
            id="is_active"
            className="w-4 h-4 rounded accent-green-500"
          />
          <label htmlFor="is_active" className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>
            Estagiário ativo (pode registrar ponto)
          </label>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="notify_email"
            checked={notifyEmail}
            onChange={e => setNotifyEmail(e.target.checked)}
            className="w-4 h-4 rounded accent-green-500"
          />
          <label htmlFor="notify_email" className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>
            Receber lembretes por e-mail
          </label>
        </div>
      </div>

      {/* Redefinição de senha — apenas no modo edição */}
      {mode === 'edit' && intern && (
        <PasswordResetSection internId={intern.id} />
      )}

      <div className="flex gap-3 pt-1">
        <motion.button
          type="button"
          onClick={() => router.back()}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors"
          style={{ border: '1px solid var(--border)', color: 'var(--text-2)', background: 'var(--bg)' }}
        >
          CANCELAR
        </motion.button>
        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.97 }}
          className="flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
          style={{ background: 'var(--primary)', color: 'white' }}
        >
          {loading
            ? <><Loader2 size={14} className="animate-spin" /> SALVANDO...</>
            : mode === 'create' ? 'CADASTRAR' : 'SALVAR ALTERAÇÕES'
          }
        </motion.button>
      </div>
    </form>
  )
}

// ── Componente de redefinição de senha ──────────────────────
function PasswordResetSection({ internId }: { internId: string }) {
  const [mode, setMode] = useState<'idle' | 'email' | 'manual'>('idle')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'err'>('idle')
  const [message, setMessage] = useState('')

  const submit = async () => {
    if (mode === 'manual' && newPassword !== confirmPassword) {
      setMessage('As senhas não coincidem.')
      setStatus('err')
      return
    }
    setStatus('loading')
    const res = await fetch('/api/admin/reset-intern-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        intern_id: internId,
        action: mode === 'email' ? 'send_reset_email' : 'set_password',
        new_password: mode === 'manual' ? newPassword : undefined,
      }),
    })
    const json = await res.json()
    if (res.ok) {
      setStatus('ok')
      setMessage(json.message || 'Concluído!')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => { setStatus('idle'); setMode('idle'); setMessage('') }, 3000)
    } else {
      setStatus('err')
      setMessage(json.error || 'Erro. Tente novamente.')
    }
  }

  return (
    <div className="rounded-2xl p-5 space-y-3" style={{ background: 'rgba(217,119,6,0.06)', border: '1px solid rgba(217,119,6,0.2)' }}>
      <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--warning)' }}>
        <Key size={14} /> REDEFINIÇÃO DE SENHA
      </h3>
      <p className="text-xs" style={{ color: 'var(--text-2)' }}>
        Como administrador, você pode redefinir a senha do estagiário de duas formas:
      </p>

      {status === 'ok' && (
        <div className="flex items-center gap-2 text-sm rounded-xl px-4 py-3" style={{ background: 'rgba(22,163,74,0.1)', color: 'var(--success)', border: '1px solid rgba(22,163,74,0.2)' }}>
          <CheckCircle2 size={14} className="flex-shrink-0" /> {message}
        </div>
      )}
      {status === 'err' && (
        <div className="flex items-center gap-2 text-sm rounded-xl px-4 py-3" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <AlertTriangle size={14} className="flex-shrink-0" /> {message}
        </div>
      )}

      {mode === 'idle' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex gap-2 flex-wrap"
        >
          {[
            { label: 'ENVIAR LINK POR E-MAIL', icon: <Mail size={13} />, onClick: () => setMode('email') },
            { label: 'DEFINIR NOVA SENHA', icon: <Lock size={13} />, onClick: () => setMode('manual') },
          ].map(({ label, icon, onClick }) => (
            <motion.button
              key={label}
              type="button"
              onClick={onClick}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-colors"
              style={{ background: 'var(--surface)', border: '1px solid rgba(217,119,6,0.25)', color: 'var(--warning)' }}
            >
              {icon} {label}
            </motion.button>
          ))}
        </motion.div>
      )}

      {mode === 'email' && (
        <div className="space-y-3">
          <p className="text-xs" style={{ color: 'var(--text-2)' }}>
            Um e-mail com link de redefinição será enviado ao estagiário.
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={() => setMode('idle')}
              className="px-4 py-2 rounded-xl text-xs font-bold transition-colors"
              style={{ border: '1px solid var(--border)', color: 'var(--text-2)', background: 'var(--bg)' }}>
              CANCELAR
            </button>
            <button type="button" onClick={submit} disabled={status === 'loading'}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-50 transition-colors"
              style={{ background: 'var(--warning)' }}>
              {status === 'loading' ? 'ENVIANDO...' : 'ENVIAR E-MAIL'}
            </button>
          </div>
        </div>
      )}

      {mode === 'manual' && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold mb-1" style={{ color: 'var(--text-2)' }}>NOVA SENHA</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none"
              style={{ background: 'var(--bg)', border: '1px solid rgba(217,119,6,0.3)', color: 'var(--text)' }}
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1" style={{ color: 'var(--text-2)' }}>CONFIRMAR NOVA SENHA</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Repita a senha"
              className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none"
              style={{ background: 'var(--bg)', border: '1px solid rgba(217,119,6,0.3)', color: 'var(--text)' }}
            />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => { setMode('idle'); setNewPassword(''); setConfirmPassword('') }}
              className="px-4 py-2 rounded-xl text-xs font-bold transition-colors"
              style={{ border: '1px solid var(--border)', color: 'var(--text-2)', background: 'var(--bg)' }}>
              CANCELAR
            </button>
            <button type="button" onClick={submit}
              disabled={status === 'loading' || newPassword.length < 6 || newPassword !== confirmPassword}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-50 transition-colors"
              style={{ background: 'var(--warning)' }}>
              {status === 'loading' ? 'SALVANDO...' : 'SALVAR NOVA SENHA'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
