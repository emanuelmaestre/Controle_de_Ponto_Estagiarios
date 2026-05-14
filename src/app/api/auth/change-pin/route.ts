import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import type { Database } from '@/types/database'

export async function POST(request: NextRequest) {
  try {
    const { new_pin, user_id } = await request.json()

    if (!new_pin || !/^\d{4,6}$/.test(new_pin)) {
      return NextResponse.json({ error: 'PIN inválido.' }, { status: 400 })
    }
    if (!user_id) {
      return NextResponse.json({ error: 'Usuário não identificado.' }, { status: 400 })
    }

    const supabaseAdmin = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    )

    // Hash do PIN com bcrypt (salt 12)
    const hashed = await bcrypt.hash(new_pin, 12)

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ pin: hashed })
      .eq('id', user_id)

    if (error) {
      return NextResponse.json({ error: 'Erro ao atualizar PIN.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[change-pin]', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
