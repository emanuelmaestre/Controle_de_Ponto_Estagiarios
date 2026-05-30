'use client'

import { useState, useEffect } from 'react'

interface Profile {
  id: string
  fullName: string
  email: string
  course: string | null
  photoUrl: string | null
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [form, setForm] = useState({ fullName: '', course: '' })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.json())
      .then(data => {
        if (data.profile) {
          setProfile(data.profile)
          setForm({ fullName: data.profile.fullName, course: data.profile.course || '' })
        }
      })
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: form.fullName, course: form.course }),
    })

    setSaving(false)
    setMessage(res.ok ? 'Perfil atualizado!' : 'Erro ao salvar.')
    if (res.ok) {
      setProfile(prev => prev ? { ...prev, fullName: form.fullName, course: form.course || null } : null)
    }
    setTimeout(() => setMessage(''), 3000)
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) { setMessage('Foto deve ter no maximo 2MB.'); return }

    setUploading(true)
    setMessage('')

    const reader = new FileReader()
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1]

      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoBase64: base64 }),
      })

      setUploading(false)
      if (res.ok) {
        setMessage('Foto atualizada!')
        const updated = await fetch('/api/profile').then(r => r.json())
        if (updated.profile) setProfile(updated.profile)
      } else {
        setMessage('Erro ao enviar foto.')
      }
      setTimeout(() => setMessage(''), 3000)
    }
    reader.readAsDataURL(file)
  }

  if (!profile) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-500">Carregando...</div>

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24">
      <header className="px-6 pt-8 pb-4">
        <h1 className="text-xl font-bold">Perfil</h1>
      </header>

      {/* Avatar */}
      <div className="px-6 mb-6 flex flex-col items-center">
        <div className="relative">
          {profile.photoUrl ? (
            <img
              src={profile.photoUrl}
              alt={profile.fullName}
              className="w-24 h-24 rounded-full object-cover border-2 border-gray-700"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gray-800 border-2 border-gray-700 flex items-center justify-center text-3xl font-bold text-gray-500">
              {profile.fullName.charAt(0)}
            </div>
          )}
          <label className="absolute bottom-0 right-0 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-green-500 transition-colors">
            <span className="text-sm">+</span>
            <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
          </label>
        </div>
        {uploading && <p className="text-xs text-gray-400 mt-2">Enviando foto...</p>}
        <p className="text-sm text-gray-400 mt-2">{profile.email}</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSave} className="px-6 space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Nome completo</label>
          <input
            type="text"
            value={form.fullName}
            onChange={e => setForm({ ...form, fullName: e.target.value })}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-green-500"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Curso</label>
          <input
            type="text"
            value={form.course}
            onChange={e => setForm({ ...form, course: e.target.value })}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-green-500"
          />
        </div>

        {message && (
          <p className={`text-sm ${message.includes('Erro') ? 'text-red-400' : 'text-green-400'}`}>{message}</p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
        >
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </form>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 inset-x-0 bg-gray-900 border-t border-gray-800 flex justify-around py-3">
        <a href="/v2/dashboard" className="text-gray-500 text-xs">Inicio</a>
        <a href="/v2/history" className="text-gray-500 text-xs">Historico</a>
        <a href="/v2/profile" className="text-green-400 text-xs font-medium">Perfil</a>
      </nav>
    </div>
  )
}
