export class Activity {
  constructor(
    public readonly id: string,
    public readonly timeRecordId: string,
    public description: string,
    public readonly createdAt: Date,
  ) {}
}
