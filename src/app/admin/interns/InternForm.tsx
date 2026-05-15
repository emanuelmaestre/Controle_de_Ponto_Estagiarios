'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
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
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3">
          {success}
        </div>
      )}

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
            placeholder="Ex: João Silva"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">E-mail *</label>
          <input
            {...register('email')}
            type="email"
            placeholder="joao@exemplo.com"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Apelido</label>
          <input
            {...register('nickname')}
            type="text"
            placeholder="Ex: João"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          {errors.nickname && <p className="text-red-500 text-xs mt-1">{errors.nickname.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Curso</label>
          <input
            {...register('course')}
            type="text"
            placeholder="Ex: Ciência da Computação"
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

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors"
        >
          {loading ? 'Salvando...' : mode === 'create' ? 'Cadastrar' : 'Salvar alterações'}
        </button>
      </div>
    </form>
  )
}
