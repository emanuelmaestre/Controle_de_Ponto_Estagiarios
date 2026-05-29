'use client'

import { useState, useEffect } from 'react'

export default function SettingsPage() {
  const [settings, setSettings] = useState({ labName: '', expectedDailyHours: 6, reportEmail: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => {
        if (data.settings) {
          setSettings({
            labName: data.settings.labName || '',
            expectedDailyHours: data.settings.expectedDailyHours || 6,
            reportEmail: data.settings.reportEmail || '',
          })
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })

    setSaving(false)
    setMessage(res.ok ? 'Configuracoes salvas!' : 'Erro ao salvar.')
    setTimeout(() => setMessage(''), 3000)
  }

  if (loading) return <p className="text-gray-600 text-sm">Carregando...</p>

  return (
    <div>
      <h2 className="text-lg font-semibold mb-6">Configuracoes</h2>

      <form onSubmit={handleSave} className="max-w-lg space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Nome do laboratorio</label>
          <input
            type="text"
            value={settings.labName}
            onChange={e => setSettings({ ...settings, labName: e.target.value })}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-green-500"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Horas diarias esperadas</label>
          <input
            type="number"
            min={1}
            max={12}
            value={settings.expectedDailyHours}
            onChange={e => setSettings({ ...settings, expectedDailyHours: Number(e.target.value) })}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-green-500"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Email para relatorios (opcional)</label>
          <input
            type="email"
            value={settings.reportEmail}
            onChange={e => setSettings({ ...settings, reportEmail: e.target.value })}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
            placeholder="gestor@email.com"
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
    </div>
  )
}
