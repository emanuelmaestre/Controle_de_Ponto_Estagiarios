import type { IAuthService } from '@/application/ports/IAuthService'

export class LogoutUseCase {
  constructor(private authService: IAuthService) {}

  async execute(): Promise<void> {
    await this.authService.logout()
  }
}
