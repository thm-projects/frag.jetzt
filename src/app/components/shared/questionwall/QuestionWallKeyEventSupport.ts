export class QuestionWallKeyEventSupport {

  private keyMap: Map<string, () => void> = new Map<string, () => void>();
  private readonly windowEvent;

  constructor() {
    this.windowEvent = e => {
      if (this.keyMap.has(e.key)) {
        this.keyMap.get(e.key)();
        e.cancelBubble = true;
      }
    };
    window.addEventListener('keyup', this.windowEvent);
  }

  public addKeyEvent(key: string, evt: () => void) {
    this.keyMap.set(key, evt);
  }

  public destroy() {
    window.removeEventListener('keyup', this.windowEvent);
  }

}
