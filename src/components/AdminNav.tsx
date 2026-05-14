import Link from 'next/link'

export default function AdminNav({ pending = 0 }: { pending?: number }) {
  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-blue-950 to-blue-800 text-white shadow-lg">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-lg">🔬</div>
          <div>
            <h1 className="font-bold text-base leading-tight">Controle de Ponto</h1>
            <p className="text-blue-300 text-xs">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
            </p>
          </div>
        </div>
        <nav className="flex items-center gap-2 text-sm">
          {pending > 0 && (
            <Link
              href="/admin/approvals"
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 px-3 py-1.5 rounded-full font-semibold transition-all hover:scale-105 text-white shadow"
            >
              ⏳ {pending} pendente{pending > 1 ? 's' : ''}
            </Link>
          )}
          <Link href="/admin" className="px-3 py-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition-all font-medium">
            Início
          </Link>
          <Link href="/admin/interns" className="px-3 py-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition-all font-medium">
            Estagiários
          </Link>
          <Link href="/admin/reports" className="px-3 py-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition-all font-medium">
            Relatórios
          </Link>
          <Link href="/admin/settings" className="px-3 py-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition-all font-medium">
            ⚙️
          </Link>
        </nav>
      </div>
    </header>
  )
}
