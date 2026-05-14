import { NextResponse, type NextRequest } from 'next/server'

// Rotas públicas que não precisam de autenticação
const PUBLIC_ROUTES = ['/login', '/api/auth', '/offline']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r))

  // Verificar se existe cookie de sessão do Supabase
  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL
    ?.replace('https://', '')
    .split('.')[0] ?? ''

  const cookieName = `sb-${projectRef}-auth-token`
  const hasSession = request.cookies.has(cookieName) ||
    request.cookies.has('sb-access-token') ||
    // Supabase v2 usa chunks
    [...request.cookies.getAll()].some(c => c.name.startsWith('sb-') && c.name.includes('-auth-token'))

  // Não autenticado tentando acessar rota protegida
  if (!hasSession && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // Autenticado tentando acessar /login — redirecionar para dashboard
  if (hasSession && pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|sw.js|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|js|css)$).*)',
  ],
}
