export class BrainstormingWord {
  constructor(
    public id: string = '',
    public sessionId: string = '',
    public word: string = '',
    public upvotes: number = 0,
    public downvotes: number = 0,
    public createdAt: Date = new Date(),
    public updatedAt: Date = null,
    public banned: boolean = false,
    public categoryId: string = '',
    public correctedWord: string = null,
  ) {}
}
