export class BrainstormingCategory {
  constructor(
    public id: string = '',
    public roomId: string = '',
    public name: string = '',
    public createdAt: Date = new Date(),
    public updatedAt: Date = null,
  ) {}
}
