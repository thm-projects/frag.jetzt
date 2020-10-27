import { Motd } from './motd';

export class MotdList {

  public messagesNew: Motd[] = [];
  public messagesOld: Motd[] = [];
  private localRead: string[];

  constructor(
    messagesNew: any,
    messagesOld: any
  ) {
    if (!localStorage.getItem('motds')) {
      localStorage.setItem('motds', JSON.stringify([]));
    }
    this.localRead = JSON.parse(localStorage.getItem('motds'));
    this.parse(this.messagesNew, messagesNew, true);
    this.parse(this.messagesOld, messagesOld, false);
  }

  private parse(list: Motd[], messages: any, isNew: boolean): void {
    messages.forEach(e => {
      const motd: Motd = new Motd(
        e.id,
        new Date(e.startTimestamp),
        new Date(e.endTimestamp),
        e.msgEnglish,
        e.msgGerman,
        isNew,
        this.localRead.indexOf(e.id) >= 0
      );
      motd.isReadEmit.subscribe(m => {
        this.updateLocaleRead(m);
      });
      list.push(motd);
    });
  }

  private updateLocaleRead(motd: Motd) {
    if (motd.isRead) {
      if (!this.hasLocale(motd.id)) {
        this.localRead.push(motd.id);
        this.updateLocaleStorage();
      }
    } else {
      if (this.hasLocale(motd.id)) {
        this.localRead = this.localRead.filter(x => x !== motd.id);
        this.updateLocaleStorage();
      }
    }
  }

  public markAllAsRead() {
    this.localRead = [];
    this.messagesNew.forEach(e => {
      e.isRead = true;
      this.localRead.push(e.id);
    });
    this.updateLocaleStorage();
  }

  private updateLocaleStorage(): void {
    localStorage.setItem('motds', JSON.stringify(this.localRead));
  }

  private hasLocale(id: string): boolean {
    return this.localRead.indexOf(id) !== -1;
  }

  public containsUnreadMessage(): boolean {
    return this.messagesNew.filter(x => x.isNew && !x.isRead).length > 0;
  }

}
