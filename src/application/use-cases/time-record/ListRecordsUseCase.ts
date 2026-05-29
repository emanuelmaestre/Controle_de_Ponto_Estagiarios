import type { TimeRecord } from '@/domain/entities/TimeRecord'
import type { Activity } from '@/domain/entities/Activity'
import type { ITimeRecordRepository } from '@/application/ports/ITimeRecordRepository'
import type { IActivityRepository } from '@/application/ports/IActivityRepository'

export interface RecordWithActivities {
  record: TimeRecord
  activities: Activity[]
}

export class ListRecordsUseCase {
  constructor(
    private recordRepo: ITimeRecordRepository,
    private activityRepo: IActivityRepository,
  ) {}

  async execute(userId: string, month: number, year: number): Promise<RecordWithActivities[]> {
    const records = await this.recordRepo.findByUser(userId, month, year)
    if (records.length === 0) return []

    const recordIds = records.map(r => r.id)
    const activities = await this.activityRepo.findByRecordIds(recordIds)

    return records.map(record => ({
      record,
      activities: activities.filter(a => a.timeRecordId === record.id),
    }))
  }
}
