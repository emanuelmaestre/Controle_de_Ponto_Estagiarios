import { cache } from 'react'
import { createSupabaseServerClient } from './server'

/**
 * Deduplicates Supabase auth.getUser() calls within a single render tree.
 * Both layout and nested server components share the same result automatically.
 */
export const getServerUser = cache(async () => {
  const supabase = await createSupabaseServerClient()
  return supabase.auth.getUser()
})

/**
 * Deduplicates profile lookups within a single render tree.
 */
export const getServerProfile = cache(async (userId: string) => {
  const supabase = await createSupabaseServerClient()
  return supabase
    .from('profiles')
    .select('full_name, role, is_active')
    .eq('id', userId)
    .maybeSingle()
})
