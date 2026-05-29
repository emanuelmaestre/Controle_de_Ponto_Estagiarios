import { NextResponse } from 'next/server'
import { DomainError } from '@/domain/errors/DomainError'
import { createSupabaseServerClient } from '@/infra/supabase/server'
import { createContainer } from '@/infra/container'

export async function getAuthenticatedContainer() {
  const serverClient = await createSupabaseServerClient()
  const { data: { user } } = await serverClient.auth.getUser()

  if (!user) return { error: unauthorized() }

  const container = createContainer(serverClient)
  return { user, container, serverClient }
}

export function unauthorized() {
  return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
}

export function handleError(error: unknown) {
  if (error instanceof DomainError) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  const message = error instanceof Error ? error.message : 'Erro interno'
  return NextResponse.json({ error: message }, { status: 500 })
}

export function ok(data: Record<string, unknown> = {}) {
  return NextResponse.json({ success: true, ...data })
}
