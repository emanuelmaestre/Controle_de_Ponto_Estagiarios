import { Settings } from '@/domain/entities/Settings'
import type { ISettingsRepository } from '@/application/ports/ISettingsRepository'
import type { SupabaseClient } from '@supabase/supabase-js'

export class SupabaseSettingsRepository implements ISettingsRepository {
  constructor(private supabase: SupabaseClient) {}

  async get(): Promise<Settings> {
    const { data } = await this.supabase
      .from('settings')
      .select('*')
      .limit(1)
      .single()

    if (!data) {
      return new Settings('default', 'ChronosLab', 6, null)
    }

    return new Settings(
      data.id,
      data.lab_name,
      data.expected_daily_hours,
      data.report_email,
    )
  }

  async update(settings: Settings): Promise<void> {
    await this.supabase
      .from('settings')
      .update({
        lab_name: settings.labName,
        expected_daily_hours: settings.expectedDailyHours,
        report_email: settings.reportEmail,
        updated_at: new Date().toISOString(),
      })
      .eq('id', settings.id)
  }
}
