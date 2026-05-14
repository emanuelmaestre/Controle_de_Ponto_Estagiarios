import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

// Cliente para Client Components (browser)
// Instância singleton para evitar múltiplos clientes
let client: ReturnType<typeof createBrowserClient<Database>> | null = null

export function createSupabaseBrowserClient() {
  if (!client) {
    client = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
  }
  return client
}
