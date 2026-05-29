import { Activity } from '@/domain/entities/Activity'

export interface IActivityRepository {
  saveMany(activities: Activity[]): Promise<void>
  findByRecordId(recordId: string): Promise<Activity[]>
  findByRecordIds(recordIds: string[]): Promise<Activity[]>
}
