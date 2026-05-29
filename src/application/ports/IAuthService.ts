export interface AuthResult {
  userId: string
  email: string
}

export interface IAuthService {
  register(name: string, email: string, password: string): Promise<AuthResult>
  logout(): Promise<void>
  resetPassword(email: string): Promise<void>
  getCurrentUser(): Promise<AuthResult | null>
}
