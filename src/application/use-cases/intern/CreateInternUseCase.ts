import { User } from '@/domain/entities/User'
import { UserRole } from '@/domain/enums/UserRole'
import { DomainError } from '@/domain/errors/DomainError'
import type { IAuthService } from '@/application/ports/IAuthService'
import type { IUserRepository } from '@/application/ports/IUserRepository'
import type { CreateInternDTO } from '@/application/dtos/CreateInternDTO'

export class CreateInternUseCase {
  constructor(
    private authService: IAuthService,
    private userRepo: IUserRepository,
  ) {}

  async execute(dto: CreateInternDTO, managerId: string): Promise<User> {
    const manager = await this.userRepo.findById(managerId)
    if (!manager || !manager.isManager) throw new DomainError('Apenas gestores podem cadastrar estagiarios')

    const existing = await this.userRepo.findByEmail(dto.email)
    if (existing) throw new DomainError('Email ja cadastrado')

    const authResult = await this.authService.register(dto.fullName, dto.email, crypto.randomUUID())

    const user = new User(
      authResult.userId,
      dto.fullName,
      dto.email,
      UserRole.INTERN,
      dto.course ?? null,
      true,
      new Date(),
    )

    await this.userRepo.save(user)
    return user
  }
}
