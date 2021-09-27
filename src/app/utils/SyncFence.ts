export class SyncFence {
  private readonly _conditions: boolean[];

  constructor(public readonly conditionCount: number,
              public readonly satisfyCallback: () => void) {
    this._conditions = new Array(conditionCount).fill(false);
  }

  resolveCondition(index: number) {
    if (!this._conditions[index]) {
      this._conditions[index] = true;
      if (this._conditions.every(condition => condition)) {
        this.satisfyCallback();
      }
    }
  }
}
