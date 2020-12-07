import { EventEmitter } from '@angular/core';

export class Motd {

  public isReadEmit: EventEmitter<Motd> = new EventEmitter<Motd>();
  public date: string;

  constructor(
    public id: string,
    public startTimestamp: Date,
    public endTimestamp: Date,
    public msgEnglish: string,
    public msgGerman: string,
    public isNew: boolean,
    public isRead: boolean
  ) {
    this.date = startTimestamp.toLocaleDateString('de-DE');
  }

  public setIsRead(isRead: boolean) {
    if (this.isRead !== isRead) {
      this.isRead = isRead;
      this.isReadEmit.emit(this);
    }
  }

}
