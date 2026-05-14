import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Rotas que não precisam de autenticação
const PUBLIC_ROUTES = ['/login', '/api/auth']

// Rotas que exigem role=manager
const ADMIN_ROUTES = ['/admin']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Deixar rotas públicas passarem
  const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r))

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // Renovar sessão (não remover esta chamada)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Não autenticado tentando acessar rota protegida
  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // Autenticado tentando acessar /login — redirecionar
  if (user && pathname === '/login') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single()

    if (!profile?.is_active) {
      await supabase.auth.signOut()
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('error', 'conta-inativa')
      return NextResponse.redirect(url)
    }

    const url = request.nextUrl.clone()
    url.pathname = profile?.role === 'manager' ? '/admin' : '/dashboard'
    return NextResponse.redirect(url)
  }

  // Verificar conta ativa e role para rotas protegidas
  if (user && !isPublic) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single()

    // Conta desativada
    if (!profile?.is_active) {
      await supabase.auth.signOut()
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('error', 'conta-inativa')
      return NextResponse.redirect(url)
    }

    // Intern tentando acessar /admin
    const isAdminRoute = ADMIN_ROUTES.some((r) => pathname.startsWith(r))
    if (isAdminRoute && profile?.role !== 'manager') {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
