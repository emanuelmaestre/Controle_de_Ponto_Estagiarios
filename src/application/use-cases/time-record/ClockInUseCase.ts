import { TimeRecord } from '@/domain/entities/TimeRecord'
import { DomainError } from '@/domain/errors/DomainError'
import type { IUserRepository } from '@/application/ports/IUserRepository'
import type { ITimeRecordRepository } from '@/application/ports/ITimeRecordRepository'

export class ClockInUseCase {
  constructor(
    private userRepo: IUserRepository,
    private recordRepo: ITimeRecordRepository,
  ) {}

  async execute(userId: string): Promise<TimeRecord> {
    const user = await this.userRepo.findById(userId)
    if (!user || !user.isActive) throw new DomainError('Usuario inativo ou nao encontrado')

    const openRecord = await this.recordRepo.findOpenByUser(userId)
    if (openRecord) throw new DomainError('Ja existe um registro aberto')

    const record = new TimeRecord(
      crypto.randomUUID(),
      userId,
      new Date(),
      null,
      null,
    )

    await this.recordRepo.save(record)
    return record
  }
}
