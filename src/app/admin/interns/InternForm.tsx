'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { internSchema } from '@/lib/validations'
import type { Profile } from '@/types/database'
import type { z } from 'zod'

// Tipo de input do formulário (antes da transformação do Zod)
type InternFormValues = {
  full_name: string
  email: string
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

  const { register, handleSubmit, formState: { errors } } = useForm<InternFormValues>({
    resolver: zodResolver(internSchema),
    defaultValues: intern ? {
      full_name: intern.full_name,
      email: intern.email,
      course: intern.course ?? '',
      internship_start: intern.internship_start ?? '',
      internship_end: intern.internship_end ?? '',
      is_active: intern.is_active,
    } : {
      is_active: true,
    },
  })

  const onSubmit = async (data: InternFormValues) => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    if (mode === 'create') {
      // 1. Criar usuário no Supabase Auth via API route
      const res = await fetch('/api/admin/create-intern', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
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
      // Editar perfil existente
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          email: data.email,
          course: data.course || null,
          internship_start: data.internship_start || null,
          internship_end: data.internship_end || null,
          is_active: data.is_active,
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">
          {success}
        </div>
      )}

      {/* Nome */}
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

      {/* E-mail */}
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

      {/* Curso */}
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

      {/* Período do estágio */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Início do estágio</label>
          <input
            {...register('internship_start')}
            type="date"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          {errors.internship_start && <p className="text-red-500 text-xs mt-1">{errors.internship_start.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fim do estágio</label>
          <input
            {...register('internship_end')}
            type="date"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          {errors.internship_end && <p className="text-red-500 text-xs mt-1">{errors.internship_end.message}</p>}
        </div>
      </div>

      {/* Status ativo */}
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

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors"
        >
          {loading ? 'Salvando...' : mode === 'create' ? 'Cadastrar' : 'Salvar alterações'}
        </button>
      </div>
    </form>
  )
}
