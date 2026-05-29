import type { User } from '@/domain/entities/User'
import { DomainError } from '@/domain/errors/DomainError'
import type { IUserRepository } from '@/application/ports/IUserRepository'

export class ListInternsUseCase {
  constructor(private userRepo: IUserRepository) {}

  async execute(managerId: string): Promise<User[]> {
    const manager = await this.userRepo.findById(managerId)
    if (!manager || !manager.isManager) throw new DomainError('Apenas gestores podem listar estagiarios')

    return this.userRepo.findAllInterns()
  }
}
