import { UserRole } from '../enums/UserRole'

export class User {
  constructor(
    public readonly id: string,
    public fullName: string,
    public email: string,
    public role: UserRole,
    public course: string | null,
    public photoUrl: string | null,
    public isActive: boolean,
    public readonly createdAt: Date,
  ) {}

  get isManager(): boolean {
    return this.role === UserRole.MANAGER
  }

  get isIntern(): boolean {
    return this.role === UserRole.INTERN
  }
}
