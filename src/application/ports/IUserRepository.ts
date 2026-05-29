import { User } from '@/domain/entities/User'

export interface IUserRepository {
  findById(id: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  findAllInterns(): Promise<User[]>
  save(user: User): Promise<void>
  update(user: User): Promise<void>
}
