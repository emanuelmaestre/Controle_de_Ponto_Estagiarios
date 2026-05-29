export class Settings {
  constructor(
    public readonly id: string,
    public labName: string,
    public expectedDailyHours: number,
    public reportEmail: string | null,
  ) {}
}
