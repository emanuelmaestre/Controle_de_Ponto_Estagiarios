import { headers } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase/server'

function isMobileUA(ua: string): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet|Touch/i.test(ua)
}

// ── Blocking page shown to desktop users ─────────────
function DesktopBlockPage() {
  return (
    <div
      style={{
        height: '100dvh',
        background: '#07170c',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        fontFamily: 'system-ui, sans-serif',
        textAlign: 'center',
      }}
    >
      {/* Animated SVG stopwatch */}
      <svg width="100" height="100" viewBox="0 0 180 180" fill="none" style={{ marginBottom: '2rem' }}>
        <circle cx="90" cy="105" r="52" fill="none" stroke="#00c853" strokeWidth="6" />
        <rect x="74" y="30" width="32" height="12" rx="6" fill="#00c853" />
        <line x1="90" y1="42" x2="90" y2="53" stroke="#00c853" strokeWidth="6" strokeLinecap="round" />
        <line x1="90" y1="105" x2="90" y2="68" stroke="#3fe56c" strokeWidth="5" strokeLinecap="round" />
        <line x1="90" y1="105" x2="115" y2="87" stroke="#00c853" strokeWidth="4" strokeLinecap="round" />
        <circle cx="90" cy="105" r="6" fill="#3fe56c" />
      </svg>

      <p style={{ color: '#3fe56c', fontWeight: 900, fontSize: '1.5rem', letterSpacing: '-0.5px', marginBottom: '0.5rem' }}>
        Chronos <span style={{ color: '#C0392B' }}>Lab</span>
      </p>

      {/* Phone icon */}
      <div style={{
        width: 72, height: 72, borderRadius: '50%',
        background: 'rgba(0,200,83,0.10)',
        border: '2px solid rgba(0,200,83,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '1.5rem auto',
        fontSize: '2rem',
      }}>
        📱
      </div>

      <h1 style={{ color: 'white', fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.75rem', lineHeight: 1.2 }}>
        Acesso apenas pelo celular
      </h1>

      <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.9rem', maxWidth: 320, lineHeight: 1.6, marginBottom: '2rem' }}>
        O painel de estagiários é exclusivo para dispositivos móveis e tablets.
        Acesse pelo seu celular ou tablet para registrar seu ponto.
      </p>

      <div style={{
        display: 'flex', flexDirection: 'column', gap: '0.75rem',
        padding: '1.25rem 1.5rem',
        background: 'rgba(0,200,83,0.06)',
        border: '1px solid rgba(0,200,83,0.12)',
        borderRadius: '16px',
        maxWidth: 300,
      }}>
        <p style={{ color: 'rgba(0,200,83,0.7)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.15em', marginBottom: '0.25rem' }}>
          DISPOSITIVOS PERMITIDOS
        </p>
        {['📱 Celular', '📟 Tablet'].map(d => (
          <div key={d} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#3fe56c', fontSize: '0.85rem', fontWeight: 600 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00c853', flexShrink: 0 }} />
            {d}
          </div>
        ))}
      </div>

      <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem', marginTop: '2rem' }}>
        Administradores podem acessar em qualquer dispositivo em{' '}
        <a href="/login" style={{ color: 'rgba(0,200,83,0.5)', textDecoration: 'none' }}>/login</a>
      </p>
    </div>
  )
}

interface Props {
  children: React.ReactNode
}

export default async function MobileOnlyGuard({ children }: Props) {
  const headersList = await headers()
  const ua = headersList.get('user-agent') ?? ''
  const mobile = isMobileUA(ua)

  if (mobile) return <>{children}</>

  // Desktop detected — check if admin (admins bypass the restriction)
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()
      if (profile?.role === 'manager') return <>{children}</>
    }
  } catch {}

  return <DesktopBlockPage />
}
