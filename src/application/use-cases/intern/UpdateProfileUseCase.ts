import { DomainError } from '@/domain/errors/DomainError'
import type { IUserRepository } from '@/application/ports/IUserRepository'

export interface UpdateProfileDTO {
  userId: string
  fullName?: string
  course?: string | null
  photoUrl?: string | null
}

export class UpdateProfileUseCase {
  constructor(private userRepo: IUserRepository) {}

  async execute(dto: UpdateProfileDTO): Promise<void> {
    const user = await this.userRepo.findById(dto.userId)
    if (!user) throw new DomainError('Usuario nao encontrado')

    if (dto.fullName !== undefined) user.fullName = dto.fullName
    if (dto.course !== undefined) user.course = dto.course

    await this.userRepo.update(user)
  }
}
