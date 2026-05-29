import type { IUserRepository } from '@/application/ports/IUserRepository'
import type { ITimeRecordRepository } from '@/application/ports/ITimeRecordRepository'
import type { IActivityRepository } from '@/application/ports/IActivityRepository'
import type { ReportFilterDTO } from '@/application/dtos/ReportFilterDTO'
import { DomainError } from '@/domain/errors/DomainError'

export interface InternReport {
  internId: string
  internName: string
  totalMinutes: number
  totalSessions: number
  records: {
    date: Date
    clockIn: Date
    clockOut: Date | null
    durationMinutes: number | null
    activities: string[]
  }[]
}

export class GetMonthlyReportUseCase {
  constructor(
    private userRepo: IUserRepository,
    private recordRepo: ITimeRecordRepository,
    private activityRepo: IActivityRepository,
  ) {}

  async execute(dto: ReportFilterDTO, managerId: string): Promise<InternReport[]> {
    const manager = await this.userRepo.findById(managerId)
    if (!manager || !manager.isManager) throw new DomainError('Apenas gestores podem gerar relatorios')

    const interns = await this.userRepo.findAllInterns()
    const allRecords = await this.recordRepo.findAllByMonth(dto.month, dto.year)
    const recordIds = allRecords.map(r => r.id)
    const allActivities = recordIds.length > 0
      ? await this.activityRepo.findByRecordIds(recordIds)
      : []

    return interns.map(intern => {
      const records = allRecords.filter(r => r.userId === intern.id)
      const totalMinutes = records.reduce((sum, r) => sum + (r.durationMinutes ?? 0), 0)

      return {
        internId: intern.id,
        internName: intern.fullName,
        totalMinutes,
        totalSessions: records.filter(r => !r.isOpen).length,
        records: records.map(r => ({
          date: r.clockIn,
          clockIn: r.clockIn,
          clockOut: r.clockOut,
          durationMinutes: r.durationMinutes,
          activities: allActivities
            .filter(a => a.timeRecordId === r.id)
            .map(a => a.description),
        })),
      }
    }).filter(r => r.records.length > 0)
  }
}
