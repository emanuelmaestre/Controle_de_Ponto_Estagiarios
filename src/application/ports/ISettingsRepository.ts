import { Settings } from '@/domain/entities/Settings'

export interface ISettingsRepository {
  get(): Promise<Settings>
  update(settings: Settings): Promise<void>
}
