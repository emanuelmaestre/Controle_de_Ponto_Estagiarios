import type { IAuthService, AuthResult } from '@/application/ports/IAuthService'
import type { SupabaseClient } from '@supabase/supabase-js'

export class SupabaseAuthService implements IAuthService {
  constructor(
    private supabase: SupabaseClient,
    private serviceClient: SupabaseClient,
  ) {}

  async register(name: string, email: string, password: string): Promise<AuthResult> {
    const { data, error } = await this.serviceClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name },
    })

    if (error) throw new Error(error.message)

    return { userId: data.user.id, email: data.user.email! }
  }

  async logout(): Promise<void> {
    await this.supabase.auth.signOut()
  }

  async resetPassword(email: string): Promise<void> {
    await this.supabase.auth.resetPasswordForEmail(email)
  }

  async getCurrentUser(): Promise<AuthResult | null> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) return null
    return { userId: user.id, email: user.email! }
  }
}
