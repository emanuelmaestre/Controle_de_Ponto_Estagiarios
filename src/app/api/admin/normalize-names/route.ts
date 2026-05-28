import { NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { formatFullName } from '@/lib/utils'

/**
 * POST /api/admin/normalize-names
 * Lê todos os perfis e corrige o full_name para o padrão pt-BR.
 * Só atualiza os registros que estão diferentes do padrão esperado.
 */
export async function POST() {
  try {
    const supabase = createSupabaseServiceClient()

    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, full_name')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!profiles?.length) return NextResponse.json({ updated: 0 })

    const toUpdate = profiles
      .map(p => ({ id: p.id, original: p.full_name, formatted: formatFullName(p.full_name) }))
      .filter(p => p.original !== p.formatted)

    if (!toUpdate.length) return NextResponse.json({ updated: 0, message: 'Todos os nomes já estão no padrão.' })

    const results = await Promise.all(
      toUpdate.map(({ id, formatted }) =>
        supabase.from('profiles').update({ full_name: formatted }).eq('id', id)
      )
    )

    const errors = results.filter(r => r.error).map(r => r.error?.message)
    if (errors.length) return NextResponse.json({ error: errors.join(', ') }, { status: 500 })

    return NextResponse.json({
      updated: toUpdate.length,
      names: toUpdate.map(p => `"${p.original}" → "${p.formatted}"`),
    })
  } catch (err) {
    console.error('[normalize-names]', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
