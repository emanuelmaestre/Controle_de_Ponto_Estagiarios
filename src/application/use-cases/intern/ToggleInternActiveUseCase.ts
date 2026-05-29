import { DomainError } from '@/domain/errors/DomainError'
import type { IUserRepository } from '@/application/ports/IUserRepository'

export class ToggleInternActiveUseCase {
  constructor(private userRepo: IUserRepository) {}

  async execute(internId: string, managerId: string): Promise<boolean> {
    const manager = await this.userRepo.findById(managerId)
    if (!manager || !manager.isManager) throw new DomainError('Apenas gestores podem alterar status')

    const intern = await this.userRepo.findById(internId)
    if (!intern) throw new DomainError('Estagiario nao encontrado')

    intern.isActive = !intern.isActive
    await this.userRepo.update(intern)
    return intern.isActive
  }
}
