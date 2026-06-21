import { User } from '@/domain/entities/User'
import { UserRole } from '@/domain/enums/UserRole'
import type { IUserRepository } from '@/application/ports/IUserRepository'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

type ProfileRow = Database['public']['Tables']['profiles']['Row']

export class SupabaseUserRepository implements IUserRepository {
  constructor(private supabase: SupabaseClient) {}

  async findById(id: string): Promise<User | null> {
    const { data } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    return data ? this.toDomain(data) : null
  }

  async findByEmail(email: string): Promise<User | null> {
    const { data } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .maybeSingle()

    return data ? this.toDomain(data) : null
  }

  async findAllInterns(): Promise<User[]> {
    const { data } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('role', 'intern')
      .order('full_name')

    return (data ?? []).map(row => this.toDomain(row))
  }

  async save(user: User): Promise<void> {
    await this.supabase.from('profiles').insert({
      id: user.id,
      full_name: user.fullName,
      email: user.email,
      role: user.role,
      course: user.course,
      photo_url: user.photoUrl,
      is_active: user.isActive,
    })
  }

  async update(user: User): Promise<void> {
    await this.supabase
      .from('profiles')
      .update({
        full_name: user.fullName,
        email: user.email,
        course: user.course,
        photo_url: user.photoUrl,
        is_active: user.isActive,
      })
      .eq('id', user.id)
  }

  private toDomain(row: ProfileRow): User {
    return new User(
      row.id,
      row.full_name,
      row.email,
      row.role as UserRole,
      row.course,
      row.photo_url ?? null,
      row.is_active,
      new Date(row.created_at),
    )
  }
}
