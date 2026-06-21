'use client'

import { useState, useEffect } from 'react'
import { minutesToHours } from '@/lib/utils'

interface RankingEntry {
  internId: string
  internName: string
  photoUrl: string | null
  totalMinutes: number
  totalSessions: number
  position: number
}

export default function RankingPage() {
  const [ranking, setRanking] = useState<RankingEntry[]>([])
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    queueMicrotask(() => {
      setLoading(true)
      fetch(`/api/ranking?month=${month}&year=${year}`)
        .then(r => r.json())
        .then(data => { setRanking(data.ranking || []); setLoading(false) })
        .catch(() => setLoading(false))
    })
  }, [month, year])

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }

  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const monthLabel = new Date(year, month - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  const medals = ['', '🥇', '🥈', '🥉']

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24">
      <header className="px-6 pt-8 pb-4">
        <h1 className="text-xl font-bold">Ranking</h1>
      </header>

      {/* Month Selector */}
      <div className="px-6 mb-6 flex items-center justify-between">
        <button onClick={prevMonth} className="text-gray-400 hover:text-white px-3 py-1">←</button>
        <span className="text-sm font-medium capitalize">{monthLabel}</span>
        <button onClick={nextMonth} className="text-gray-400 hover:text-white px-3 py-1">→</button>
      </div>

      {/* Ranking List */}
      <section className="px-6">
        {loading ? (
          <p className="text-gray-600 text-sm">Carregando...</p>
        ) : ranking.length === 0 ? (
          <p className="text-gray-600 text-sm">Nenhum registro neste mes.</p>
        ) : (
          <div className="space-y-2">
            {ranking.map(entry => (
              <div
                key={entry.internId}
                className={`bg-gray-900 rounded-xl p-4 border flex items-center gap-4 ${
                  entry.position <= 3 ? 'border-green-900' : 'border-gray-800'
                }`}
              >
                {/* Position */}
                <div className="w-10 text-center">
                  {entry.position <= 3 ? (
                    <span className="text-2xl">{medals[entry.position]}</span>
                  ) : (
                    <span className="text-lg font-bold text-gray-500">{entry.position}</span>
                  )}
                </div>

                {/* Avatar */}
                {entry.photoUrl ? (
                  <img
                    src={entry.photoUrl}
                    alt={entry.internName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-sm font-bold text-gray-500">
                    {entry.internName.charAt(0)}
                  </div>
                )}

                {/* Name + Hours */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{entry.internName}</p>
                  <p className="text-xs text-gray-500">{entry.totalSessions} sessoes</p>
                </div>

                <span className="text-sm font-bold text-green-400">
                  {minutesToHours(entry.totalMinutes)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 inset-x-0 bg-gray-900 border-t border-gray-800 flex justify-around py-3">
        <a href="/v2/dashboard" className="text-gray-500 text-xs">Inicio</a>
        <a href="/v2/history" className="text-gray-500 text-xs">Historico</a>
        <a href="/v2/ranking" className="text-green-400 text-xs font-medium">Ranking</a>
        <a href="/v2/profile" className="text-gray-500 text-xs">Perfil</a>
      </nav>
    </div>
  )
}
