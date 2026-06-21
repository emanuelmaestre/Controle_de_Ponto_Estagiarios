'use client'

import { useState, useEffect } from 'react'

interface Intern {
  id: string
  fullName: string
  email: string
  course: string | null
  isActive: boolean
}

export default function InternsPage() {
  const [interns, setInterns] = useState<Intern[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ fullName: '', email: '', course: '' })
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function loadInterns() {
    const res = await fetch('/api/interns')
    const data = await res.json()
    setInterns(data.interns || [])
    setLoading(false)
  }

  useEffect(() => {
    queueMicrotask(() => {
      void loadInterns()
    })
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    setSubmitting(true)

    const res = await fetch('/api/interns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        course: form.course || undefined,
      }),
    })

    const data = await res.json()
    setSubmitting(false)

    if (!res.ok) { setFormError(data.error); return }

    setForm({ fullName: '', email: '', course: '' })
    setShowForm(false)
    loadInterns()
  }

  async function toggleActive(internId: string) {
    await fetch('/api/interns/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ internId }),
    })
    loadInterns()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">Estagiarios</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm rounded-xl transition-colors"
        >
          {showForm ? 'Cancelar' : 'Novo estagiario'}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-6 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Nome completo</label>
            <input
              type="text"
              value={form.fullName}
              onChange={e => setForm({ ...form, fullName: e.target.value })}
              required
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-green-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-green-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Curso (opcional)</label>
            <input
              type="text"
              value={form.course}
              onChange={e => setForm({ ...form, course: e.target.value })}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-green-500"
            />
          </div>
          {formError && <p className="text-red-400 text-sm">{formError}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
          >
            {submitting ? 'Criando...' : 'Criar estagiario'}
          </button>
        </form>
      )}

      {/* Intern Table */}
      {loading ? (
        <p className="text-gray-600 text-sm">Carregando...</p>
      ) : (
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Nome</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium hidden md:table-cell">Email</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium hidden md:table-cell">Curso</th>
                <th className="text-center px-4 py-3 text-gray-400 font-medium">Status</th>
                <th className="text-center px-4 py-3 text-gray-400 font-medium">Acao</th>
              </tr>
            </thead>
            <tbody>
              {interns.map(intern => (
                <tr key={intern.id} className="border-b border-gray-800 last:border-0">
                  <td className="px-4 py-3 text-white">{intern.fullName}</td>
                  <td className="px-4 py-3 text-gray-400 hidden md:table-cell">{intern.email}</td>
                  <td className="px-4 py-3 text-gray-400 hidden md:table-cell">{intern.course ?? '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-1 rounded-lg ${intern.isActive ? 'bg-green-950 text-green-400' : 'bg-red-950 text-red-400'}`}>
                      {intern.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleActive(intern.id)}
                      className="text-xs text-gray-400 hover:text-white"
                    >
                      {intern.isActive ? 'Desativar' : 'Ativar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
