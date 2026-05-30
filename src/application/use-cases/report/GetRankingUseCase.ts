import type { IUserRepository } from '@/application/ports/IUserRepository'
import type { ITimeRecordRepository } from '@/application/ports/ITimeRecordRepository'

export interface RankingEntry {
  internId: string
  internName: string
  photoUrl: string | null
  totalMinutes: number
  totalSessions: number
  position: number
}

export class GetRankingUseCase {
  constructor(
    private userRepo: IUserRepository,
    private recordRepo: ITimeRecordRepository,
  ) {}

  async execute(month: number, year: number): Promise<RankingEntry[]> {
    const interns = await this.userRepo.findAllInterns()
    const allRecords = await this.recordRepo.findAllByMonth(month, year)

    const ranking = interns
      .map(intern => {
        const records = allRecords.filter(r => r.userId === intern.id)
        const totalMinutes = records.reduce((sum, r) => sum + (r.durationMinutes ?? 0), 0)
        const totalSessions = records.filter(r => !r.isOpen).length
        return {
          internId: intern.id,
          internName: intern.fullName,
          photoUrl: intern.photoUrl,
          totalMinutes,
          totalSessions,
          position: 0,
        }
      })
      .filter(r => r.totalMinutes > 0)
      .sort((a, b) => b.totalMinutes - a.totalMinutes)

    ranking.forEach((entry, i) => { entry.position = i + 1 })
    return ranking
  }
}
