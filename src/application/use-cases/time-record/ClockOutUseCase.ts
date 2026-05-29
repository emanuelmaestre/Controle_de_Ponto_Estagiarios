import { Activity } from '@/domain/entities/Activity'
import { DomainError } from '@/domain/errors/DomainError'
import type { ITimeRecordRepository } from '@/application/ports/ITimeRecordRepository'
import type { IActivityRepository } from '@/application/ports/IActivityRepository'
import type { ClockOutDTO } from '@/application/dtos/ClockOutDTO'

export class ClockOutUseCase {
  constructor(
    private recordRepo: ITimeRecordRepository,
    private activityRepo: IActivityRepository,
  ) {}

  async execute(dto: ClockOutDTO): Promise<void> {
    const record = await this.recordRepo.findById(dto.recordId)
    if (!record) throw new DomainError('Registro nao encontrado')
    if (record.userId !== dto.userId) throw new DomainError('Registro nao pertence a este usuario')
    if (!record.isOpen) throw new DomainError('Registro ja fechado')
    if (dto.activities.length === 0) throw new DomainError('Informe pelo menos uma atividade')

    record.close(new Date())
    record.notes = dto.notes ?? null

    await this.recordRepo.update(record)

    const activities = dto.activities.map(desc => new Activity(
      crypto.randomUUID(),
      dto.recordId,
      desc,
      new Date(),
    ))

    await this.activityRepo.saveMany(activities)
  }
}
