import { createSupabaseServiceClient } from '@/lib/supabase/server'

type MinProfile = {
  full_name: string
  total_hours_required: number | null
  role: 'intern' | 'manager'
  photo_url: string | null
}

// Garante que existe um perfil para o usuário autenticado.
// NUNCA apaga dados de forma assíncrona — tudo é feito com await, de forma síncrona,
// para evitar que o serverless encerre a função antes de concluir.
export async function ensureProfile(
  userId: string,
  email: string | null,
): Promise<MinProfile | null> {
  const admin = createSupabaseServiceClient()

  // 1) Já existe pelo UUID atual? (caminho normal)
  const { data: byId } = await admin
    .from('profiles')
    .select('full_name, total_hours_required, role, photo_url')
    .eq('id', userId)
    .maybeSingle()
  if (byId) return byId

  // 2) Existe com outro UUID (mesmo email)? Migra com segurança.
  if (email) {
    const { data: byEmail } = await admin
      .from('profiles')
      .select('id, full_name, total_hours_required, role, photo_url, email, course, nickname, internship_start, internship_end, pin, is_active, created_at')
      .eq('email', email)
      .maybeSingle()

    if (byEmail) {
      const oldId = byEmail.id

      // Migra registros de ponto do UUID antigo para o novo (se houver)
      await admin.from('time_records').update({ intern_id: userId } as never).eq('intern_id', oldId)

      // Deleta o perfil antigo e recria com o UUID correto — TUDO com await
      await admin.from('profiles').delete().eq('id', oldId)
      const { data: migrated } = await admin
        .from('profiles')
        .insert({
          id: userId,
          full_name: byEmail.full_name,
          email: byEmail.email,
          course: byEmail.course,
          nickname: byEmail.nickname,
          photo_url: byEmail.photo_url,
          internship_start: byEmail.internship_start,
          internship_end: byEmail.internship_end,
          pin: byEmail.pin,
          role: byEmail.role,
          is_active: byEmail.is_active,
          total_hours_required: byEmail.total_hours_required,
        })
        .select('full_name, total_hours_required, role, photo_url')
        .single()
      return migrated ?? {
        full_name: byEmail.full_name,
        total_hours_required: byEmail.total_hours_required,
        role: byEmail.role,
        photo_url: byEmail.photo_url,
      }
    }
  }

  // 3) Não existe em lugar nenhum — tenta recuperar metadados do auth user
  //    (salvos durante o cadastro) antes de criar perfil mínimo.
  const { data: authUser } = await admin.auth.admin.getUserById(userId)
  const meta = authUser?.user?.user_metadata ?? {}
  const fallbackName = meta.full_name || (email ? email.split('@')[0] : 'Estagiário')

  const { data: created } = await admin
    .from('profiles')
    .insert({
      id: userId,
      email: email ?? `${userId}@sememail.local`,
      full_name: fallbackName,
      nickname: meta.nickname || null,
      course: meta.course || null,
      role: 'intern',
      is_active: true,
      internship_start: new Date().toISOString().slice(0, 10),
    })
    .select('full_name, total_hours_required, role, photo_url')
    .single()

  return created ?? null
}
