import { EventEmitter } from '@angular/core';

export class Motd {

  public isReadEmit: EventEmitter<Motd> = new EventEmitter<Motd>();
  public date: string;
  private readonly fallbackKey: string;

  constructor(
    public id: string,
    public startTimestamp: Date,
    public endTimestamp: Date,
    public isNew: boolean,
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

  public setIsRead(isRead: boolean) {
    if (this.isRead !== isRead) {
      this.isRead = isRead;
      this.isReadEmit.emit(this);
    }
  }

}
