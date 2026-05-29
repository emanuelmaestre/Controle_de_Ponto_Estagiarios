import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseServiceClient } from '@/lib/supabase/server'

// Detecta e corrige perfil com UUID divergente do auth user.
// Situação: usuário existe em auth.users com UUID novo, mas o profile
// ainda tem o UUID antigo (de uma sessão anterior deletada e recriada).

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    // 1. Verifica se já existe profile com o UUID correto
    const { data: profileById } = await supabase
      .from('profiles')
      .select('id, full_name, email, course, photo_url, role, internship_start, nickname')
      .eq('id', user.id)
      .maybeSingle()

    if (profileById) {
      return NextResponse.json({ ok: true, status: 'profile_ok', profile: profileById })
    }

    // 2. Sem profile pelo UUID — busca pelo email usando service role
    const admin = createSupabaseServiceClient()
    const { data: profileByEmail } = await admin
      .from('profiles')
      .select('id, full_name, email, course, photo_url, role, internship_start, nickname')
      .eq('email', user.email!)
      .maybeSingle()

    if (!profileByEmail) {
      // 3. Sem profile em lugar nenhum — cria um básico
      const { error: insertErr } = await admin.from('profiles').insert({
        id: user.id,
        email: user.email!,
        full_name: user.email!.split('@')[0],
        role: 'intern',
        is_active: true,
        internship_start: new Date().toISOString().slice(0, 10),
      })
      if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })
      return NextResponse.json({ ok: true, status: 'profile_created_minimal' })
    }

    // 4. Profile existe com UUID antigo — migra para o UUID correto
    const oldId = profileByEmail.id
    const { error: insertErr } = await admin.from('profiles').insert({
      ...profileByEmail,
      id: user.id, // novo UUID correto
    })
    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })

    // Remove o antigo
    await admin.from('profiles').delete().eq('id', oldId)

    return NextResponse.json({
      ok: true,
      status: 'profile_migrated',
      old_id: oldId,
      new_id: user.id,
    })
  } catch (err) {
    console.error('[repair-profile]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
