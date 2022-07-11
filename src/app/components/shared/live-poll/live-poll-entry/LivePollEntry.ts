export class LivePollList {
  public list: LivePollEntry[] = [];
  public sum: number = 0;
  public highest: number = 0;

  constructor() {
  }

  public propagate = () => {
    this.list.forEach(e => e.sum = this.sum);
  };
}

export class LivePollEntry {
  public value: number = 0;
  public sum: number = 0;
  public symbol: string;
}
