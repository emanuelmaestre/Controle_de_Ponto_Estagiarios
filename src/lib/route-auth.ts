import { NextResponse } from 'next/server'
import type { User } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function requireAuthenticatedUser() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Nao autenticado' }, { status: 401 }),
    }
  }

  return { ok: true as const, supabase, user }
}

export async function requireManager() {
  const auth = await requireAuthenticatedUser()
  if (!auth.ok) return auth

  const { data: profile, error } = await auth.supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', auth.user.id)
    .maybeSingle()

  if (error || profile?.role !== 'manager' || profile?.is_active === false) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Acesso negado' }, { status: 403 }),
    }
  }

  return { ok: true as const, supabase: auth.supabase, user: auth.user as User, profile }
}

export async function canManageTargetUser(targetUserId: string) {
  const auth = await requireAuthenticatedUser()
  if (!auth.ok) return auth

  if (auth.user.id === targetUserId) {
    return { ok: true as const, supabase: auth.supabase, user: auth.user, isManager: false }
  }

  const { data: profile, error } = await auth.supabase
    .from('profiles')
    .select('role')
    .eq('id', auth.user.id)
    .maybeSingle()

  if (error || profile?.role !== 'manager') {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Acesso negado' }, { status: 403 }),
    }
  }

  return { ok: true as const, supabase: auth.supabase, user: auth.user, isManager: true }
}
