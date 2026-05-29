import { DomainError } from '../errors/DomainError'

export class TimeRecord {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly clockIn: Date,
    public clockOut: Date | null,
    public notes: string | null,
  ) {}

  get isOpen(): boolean {
    return this.clockOut === null
  }

  get durationMinutes(): number | null {
    if (!this.clockOut) return null
    return Math.floor((this.clockOut.getTime() - this.clockIn.getTime()) / 60000)
  }

  close(now: Date): void {
    if (!this.isOpen) throw new DomainError('Registro ja fechado')
    this.clockOut = now
  }
}
