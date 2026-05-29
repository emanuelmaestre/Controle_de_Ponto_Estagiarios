import { TimeRecord } from '@/domain/entities/TimeRecord'

export interface ITimeRecordRepository {
  save(record: TimeRecord): Promise<void>
  findById(id: string): Promise<TimeRecord | null>
  findOpenByUser(userId: string): Promise<TimeRecord | null>
  findByUser(userId: string, month: number, year: number): Promise<TimeRecord[]>
  findTodayByUser(userId: string): Promise<TimeRecord[]>
  findAllByMonth(month: number, year: number): Promise<TimeRecord[]>
  update(record: TimeRecord): Promise<void>
}
