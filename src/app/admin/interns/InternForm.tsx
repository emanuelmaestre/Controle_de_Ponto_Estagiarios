'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react'
import { internSchema } from '@/lib/validations'
import type { Profile } from '@/types/database'

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

  const { register, handleSubmit, formState: { errors } } = useForm<InternFormValues>({
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
      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Foto de perfil</h3>
        <div className="flex flex-col items-center gap-3">
          <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center">
            {photoPreview ? (
              <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl">📷</span>
            )}
          </div>
          <label className="cursor-pointer text-sm text-blue-700 font-medium hover:underline">
            {photoPreview ? 'Trocar foto' : 'Adicionar foto'}
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </label>
        </div>
      </div>

      {/* Dados Pessoais */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
        <h3 className="text-sm font-semibold text-slate-700">Dados Pessoais</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo *</label>
          <input
            {...register('full_name')}
            type="text"
            placeholder="Ex: Miltão Rei da Galáxia"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Apelido</label>
          <input
            {...register('nickname')}
            type="text"
            placeholder="Ex: Miltinho"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          {errors.nickname && <p className="text-red-500 text-xs mt-1">{errors.nickname.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">E-mail *</label>
          <input
            {...register('email')}
            type="email"
            placeholder="Ex: milton@exemplo.com"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Curso</label>
          <input
            {...register('course')}
            type="text"
            placeholder="Ex: Agronomia"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          {errors.course && <p className="text-red-500 text-xs mt-1">{errors.course.message}</p>}
        </div>
      </div>

      {/* Período do estágio */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
        <h3 className="text-sm font-semibold text-slate-700">Período do Estágio</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data de início</label>
            <input
              {...register('internship_start')}
              type="date"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            {errors.internship_start && <p className="text-red-500 text-xs mt-1">{errors.internship_start.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data de término</label>
            <input
              {...register('internship_end')}
              type="date"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            {errors.internship_end && <p className="text-red-500 text-xs mt-1">{errors.internship_end.message}</p>}
          </div>
        </div>
      </div>

      {/* Configurações */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
        <h3 className="text-sm font-semibold text-slate-700">Configurações</h3>

        <div className="flex items-center gap-3">
          <input
            {...register('is_active')}
            type="checkbox"
            id="is_active"
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
            Estagiário ativo (pode registrar ponto)
          </label>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="notify_email"
            checked={notifyEmail}
            onChange={e => setNotifyEmail(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="notify_email" className="text-sm font-medium text-gray-700">
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
          className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </motion.button>
        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.97 }}
          className="flex-1 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
        >
          {loading
            ? <><Loader2 size={14} className="animate-spin" /> Salvando...</>
            : mode === 'create' ? 'Cadastrar' : 'Salvar alterações'
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
    <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100 shadow-sm space-y-3">
      <h3 className="text-sm font-semibold text-amber-800 flex items-center gap-2">
        🔑 Redefinição de senha
      </h3>
      <p className="text-xs text-amber-700">
        Como administrador, você pode redefinir a senha do estagiário de duas formas:
      </p>

      {status === 'ok' && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3">
          ✅ {message}
        </div>
      )}
      {status === 'err' && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          ⚠️ {message}
        </div>
      )}

      {mode === 'idle' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex gap-2 flex-wrap"
        >
          {[
            { label: '✉️ Enviar link por e-mail', onClick: () => setMode('email') },
            { label: '🔒 Definir nova senha', onClick: () => setMode('manual') },
          ].map(({ label, onClick }) => (
            <motion.button
              key={label}
              type="button"
              onClick={onClick}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              className="flex items-center gap-1.5 px-4 py-2 bg-white border border-amber-200 text-amber-800 text-sm font-medium rounded-xl hover:bg-amber-50 transition-colors"
            >
              {label}
            </motion.button>
          ))}
        </motion.div>
      )}

      {mode === 'email' && (
        <div className="space-y-3">
          <p className="text-xs text-amber-700">
            Um e-mail com link de redefinição será enviado ao estagiário.
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={() => setMode('idle')}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
              Cancelar
            </button>
            <button type="button" onClick={submit} disabled={status === 'loading'}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
              {status === 'loading' ? 'Enviando...' : 'Enviar e-mail'}
            </button>
          </div>
        </div>
      )}

      {mode === 'manual' && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-amber-800 mb-1">Nova senha</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="w-full px-3 py-2.5 border border-amber-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-amber-800 mb-1">Confirmar nova senha</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Repita a senha"
              className="w-full px-3 py-2.5 border border-amber-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => { setMode('idle'); setNewPassword(''); setConfirmPassword('') }}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
              Cancelar
            </button>
            <button type="button" onClick={submit}
              disabled={status === 'loading' || newPassword.length < 6 || newPassword !== confirmPassword}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
              {status === 'loading' ? 'Salvando...' : 'Salvar nova senha'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
