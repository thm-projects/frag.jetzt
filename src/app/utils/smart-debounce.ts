export class SmartDebounce {
  private readonly minDelay: number;
  private readonly maxDelay: number;
  private debounceTimer;
  private lastDebounceTime = new Date().getTime();
  private minDebounceCount = 0;

  constructor(minDelay: number, maxDelay: number) {
    if (minDelay < 0) {
      throw new Error('minDelay should be positive.');
    } else if (maxDelay < minDelay) {
      throw new Error('maxDelay should be greater than minDelay');
    }
    this.minDelay = minDelay;
    this.maxDelay = maxDelay;
  }

  call(func: () => void) {
    clearTimeout(this.debounceTimer);
    const current = new Date().getTime();
    const diff = current - this.lastDebounceTime;
    const callFunc = () => {
      this.lastDebounceTime = current;
      this.minDebounceCount = 0;
      func();
    };
    if (diff >= this.maxDelay) {
      if (this.minDelay * this.minDebounceCount++ >= this.maxDelay) {
        callFunc();
      } else {
        this.debounceTimer = setTimeout(callFunc, this.minDelay);
      }
    } else {
      this.debounceTimer = setTimeout(callFunc, Math.max(this.minDelay, this.maxDelay - diff));
    }
  }
}
