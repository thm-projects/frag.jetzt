export class GlobalConfig {

  public static shortId: string;
  public static encodedShortId: string;
  private static shortIdChangeListener: (() => void)[] = [];
  public static setShortId(shortId: string) {
    this.shortId = shortId;
    this.encodedShortId = encodeURIComponent(shortId)
    .replace('\~', '%7E')
    .replace('\.', '%2E')
    .replace('\_', '%5F')
    .replace('\-', '%2D');
    this.shortIdChangeListener.forEach(e => e());
  }

  public static subscribeShortId(action: () => void, run?: boolean) {
    this.shortIdChangeListener.push(action);
    if (run) {
      action();
    }
  }

}
