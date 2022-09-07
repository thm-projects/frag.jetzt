export class Motd {

  public date: string;
  private readonly fallbackKey: string;

  constructor(
    public id: string,
    public startTimestamp: Date,
    public endTimestamp: Date,
    public isRead: boolean,
    public messages: { [key: string]: { message: string } },
  ) {
    const arr = Object.keys(messages);
    this.fallbackKey = arr.includes('en') ? 'en' : arr[0];
  }

  public getMessage(language: string) {
    const message = this.messages[language]?.message;
    return message ?? this.messages[this.fallbackKey]?.message;
  }

}
