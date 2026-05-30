import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/login', '/register', '/set-password', '/setup-pin', '/offline', '/api/auth', '/_next', '/favicon', '/icons', '/sw.js', '/manifest.json', '/v2/login', '/v2/register']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Deixar arquivos estáticos e rotas públicas passarem
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Verificar se tem cookie de sessão Supabase
  const hasSession = request.cookies.getAll().some(
    c => c.name.startsWith('sb-') && c.name.includes('auth-token')
  )

  // Sem sessão → redirecionar para login
  if (!hasSession) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    if (pathname !== '/') {
      url.searchParams.set('redirect', pathname)
    }
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|sw.js|manifest.json|.*\\.png$|.*\\.svg$).*)'],
}
