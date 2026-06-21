import { NextResponse } from 'next/server'
import { requireManager } from '@/lib/route-auth'

export async function GET() {
  const auth = await requireManager()
  if (!auth.ok) return auth.response

  const { data, error } = await auth.supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'intern')
    .eq('is_active', true)
    .order('full_name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ interns: data ?? [] })
}
