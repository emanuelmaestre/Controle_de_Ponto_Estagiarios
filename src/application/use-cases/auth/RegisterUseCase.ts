import { User } from '@/domain/entities/User'
import { UserRole } from '@/domain/enums/UserRole'
import { DomainError } from '@/domain/errors/DomainError'
import type { IAuthService } from '@/application/ports/IAuthService'
import type { IUserRepository } from '@/application/ports/IUserRepository'
import type { RegisterDTO } from '@/application/dtos/RegisterDTO'

export class RegisterUseCase {
  constructor(
    private authService: IAuthService,
    private userRepo: IUserRepository,
  ) {}

  async execute(dto: RegisterDTO): Promise<User> {
    const existing = await this.userRepo.findByEmail(dto.email)
    if (existing) throw new DomainError('Email ja cadastrado')

    const authResult = await this.authService.register(dto.fullName, dto.email, dto.password)

    const user = new User(
      authResult.userId,
      dto.fullName,
      dto.email,
      UserRole.INTERN,
      dto.course ?? null,
      null,
      true,
      new Date(),
    )

    await this.userRepo.save(user)
    return user
  }
}
