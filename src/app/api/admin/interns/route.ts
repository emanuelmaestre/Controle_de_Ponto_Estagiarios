// @ts-nocheck
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'intern')
    .eq('is_active', true)
    .order('full_name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ interns: data ?? [] })
}
