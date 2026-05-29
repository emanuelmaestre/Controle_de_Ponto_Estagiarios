import { NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/infra/supabase/server'
import { ok } from '@/lib/api-helpers'

export async function POST(request: NextRequest) {
  const { email } = await request.json()

  if (email) {
    const supabase = await createSupabaseServerClient()
    await supabase.auth.resetPasswordForEmail(email)
  }

  return ok()
}
