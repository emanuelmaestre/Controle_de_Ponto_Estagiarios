import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export default async function AdminNav({ pending = 0 }: { pending?: number }) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = user
    ? await supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle()
    : { data: null }

  const navItems = [
    { href: '/admin', label: 'Início', icon: '🏠' },
    { href: '/admin/interns', label: 'Estagiários', icon: '👥' },
    { href: '/admin/approvals', label: 'Aprovações', icon: '✅', badge: pending },
    { href: '/admin/reports', label: 'Relatórios', icon: '📊' },
    { href: '/admin/settings', label: 'Config', icon: '⚙️' },
  ]

  return (
    <>
      {/* Desktop/Tablet header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-blue-950 via-blue-900 to-blue-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-lg backdrop-blur">🔬</div>
            <div>
              <h1 className="font-bold text-sm leading-tight">Controle de Ponto</h1>
              <p className="text-blue-300 text-[11px] hidden sm:block">
                {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
              </p>
            </div>
          </div>

          {/* Nav desktop */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-blue-200 hover:text-white hover:bg-white/10 transition-all text-sm font-medium"
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
                {(item.badge ?? 0) > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 text-blue-950 text-[10px] font-black rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <span className="text-blue-300 text-xs hidden lg:block">{profile?.full_name ?? 'Gerente'}</span>
            <form action="/api/auth/signout" method="POST">
              <button className="text-xs text-blue-300 hover:text-white border border-blue-700 hover:border-blue-400 px-2.5 py-1.5 rounded-lg transition-all">
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-lg">
        <div className="flex justify-around items-center">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center gap-0.5 py-2.5 px-2 text-slate-500 hover:text-blue-700 transition-colors flex-1"
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-[10px] font-semibold">{item.label}</span>
              {(item.badge ?? 0) > 0 && (
                <span className="absolute top-1 right-1/4 w-4 h-4 bg-amber-400 text-blue-950 text-[10px] font-black rounded-full flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </div>
      </nav>
    </>
  )
}
