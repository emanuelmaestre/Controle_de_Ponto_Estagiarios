import { TimeRecord } from '@/domain/entities/TimeRecord'
import type { ITimeRecordRepository } from '@/application/ports/ITimeRecordRepository'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

type TimeRecordRow = Database['public']['Tables']['time_records']['Row']

export class SupabaseTimeRecordRepository implements ITimeRecordRepository {
  constructor(private supabase: SupabaseClient) {}

  async save(record: TimeRecord): Promise<void> {
    await this.supabase.from('time_records').insert({
      id: record.id,
      intern_id: record.userId,
      clock_in: record.clockIn.toISOString(),
      clock_out: record.clockOut?.toISOString() ?? null,
      notes: record.notes,
    })
  }

  async findById(id: string): Promise<TimeRecord | null> {
    const { data } = await this.supabase
      .from('time_records')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    return data ? this.toDomain(data) : null
  }

  async findOpenByUser(userId: string): Promise<TimeRecord | null> {
    const { data } = await this.supabase
      .from('time_records')
      .select('*')
      .eq('intern_id', userId)
      .is('clock_out', null)
      .maybeSingle()

    return data ? this.toDomain(data) : null
  }

  async findByUser(userId: string, month: number, year: number): Promise<TimeRecord[]> {
    const start = new Date(year, month - 1, 1)
    const end = new Date(year, month, 1)

    const { data } = await this.supabase
      .from('time_records')
      .select('*')
      .eq('intern_id', userId)
      .gte('clock_in', start.toISOString())
      .lt('clock_in', end.toISOString())
      .order('clock_in', { ascending: false })

    return (data ?? []).map(row => this.toDomain(row))
  }

  async findTodayByUser(userId: string): Promise<TimeRecord[]> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const { data } = await this.supabase
      .from('time_records')
      .select('*')
      .eq('intern_id', userId)
      .gte('clock_in', today.toISOString())
      .lt('clock_in', tomorrow.toISOString())
      .order('clock_in', { ascending: true })

    return (data ?? []).map(row => this.toDomain(row))
  }

  async findAllByMonth(month: number, year: number): Promise<TimeRecord[]> {
    const start = new Date(year, month - 1, 1)
    const end = new Date(year, month, 1)

    const { data } = await this.supabase
      .from('time_records')
      .select('*')
      .gte('clock_in', start.toISOString())
      .lt('clock_in', end.toISOString())
      .order('clock_in', { ascending: false })

    return (data ?? []).map(row => this.toDomain(row))
  }

  async update(record: TimeRecord): Promise<void> {
    await this.supabase
      .from('time_records')
      .update({
        clock_out: record.clockOut?.toISOString() ?? null,
        notes: record.notes,
      })
      .eq('id', record.id)
  }

  private toDomain(row: TimeRecordRow): TimeRecord {
    return new TimeRecord(
      row.id,
      row.intern_id,
      new Date(row.clock_in),
      row.clock_out ? new Date(row.clock_out) : null,
      row.notes,
    )
  }
}
