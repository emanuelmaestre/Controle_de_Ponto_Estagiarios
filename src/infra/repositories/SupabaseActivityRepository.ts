import { Activity } from '@/domain/entities/Activity'
import type { IActivityRepository } from '@/application/ports/IActivityRepository'
import type { SupabaseClient } from '@supabase/supabase-js'

export class SupabaseActivityRepository implements IActivityRepository {
  constructor(private supabase: SupabaseClient) {}

  async saveMany(activities: Activity[]): Promise<void> {
    if (activities.length === 0) return

    await this.supabase.from('activities').insert(
      activities.map(a => ({
        id: a.id,
        time_record_id: a.timeRecordId,
        description: a.description,
      })),
    )
  }

  async findByRecordId(recordId: string): Promise<Activity[]> {
    const { data } = await this.supabase
      .from('activities')
      .select('*')
      .eq('time_record_id', recordId)
      .order('created_at')

    return (data ?? []).map(row => this.toDomain(row))
  }

  async findByRecordIds(recordIds: string[]): Promise<Activity[]> {
    if (recordIds.length === 0) return []

    const { data } = await this.supabase
      .from('activities')
      .select('*')
      .in('time_record_id', recordIds)
      .order('created_at')

    return (data ?? []).map(row => this.toDomain(row))
  }

  private toDomain(row: any): Activity {
    return new Activity(
      row.id,
      row.time_record_id,
      row.description,
      new Date(row.created_at),
    )
  }
}
