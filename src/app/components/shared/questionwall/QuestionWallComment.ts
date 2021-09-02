import { Comment } from '../../../models/comment';

export class QuestionWallComment {
  public static readonly TIME_FORMAT_DE: string[][] =
  [
    ['vor % Jahr', 'vor % Jahren'],
    ['vor % Monat', 'vor % Monaten'],
    ['vor % Tag', 'vor % Tagen'],
    ['vor % Stunde', 'vor % Stunden'],
    ['vor % Minute', 'vor % Minuten'],
    ['vor % Sekunde', 'vor % Sekunden']
  ];
  public static readonly TIME_FORMAT_EN: string[][] = [
    ['% year ago', '% years ago'],
    ['% month ago', '% months ago'],
    ['% day ago', '% days ago'],
    ['% hour ago', '% hours ago'],
    ['% minute ago', '% minutes ago'],
    ['% second ago', '% seconds ago'],
  ];

  public static currentTimeFormat: string[][] = QuestionWallComment.TIME_FORMAT_EN;

  public date: Date;
  public timeAgo: string;

  constructor(
    public comment: Comment,
    public old: boolean
    ) {
    this.date = new Date(comment.timestamp);
    this.updateTimeAgo();
  }

  public static updateTimeFormat(lang: string) {
    this.currentTimeFormat = this['TIME_FORMAT_' + lang.toUpperCase()];
  }

  public update() {
  }

  public updateTimeAgo() {
    const seconds = Math.floor((new Date().getTime() - this.date.getTime()) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(months / 12);
    if (this.setTime(years, QuestionWallComment.currentTimeFormat[0])) {return; }
    if (this.setTime(months, QuestionWallComment.currentTimeFormat[1])) {return; }
    if (this.setTime(days, QuestionWallComment.currentTimeFormat[2])) {return; }
    if (this.setTime(hours, QuestionWallComment.currentTimeFormat[3])) {return; }
    if (this.setTime(minutes, QuestionWallComment.currentTimeFormat[4])) {return; }
    if (this.setTime(seconds, QuestionWallComment.currentTimeFormat[5])) {return; }
    this.timeAgo = QuestionWallComment.currentTimeFormat[5][0].replace('%', '1');
  }

  private setTime(time: number, format: string[]): boolean {
    if (time > 0) {
      if (time === 1) {
        this.timeAgo = format[0].replace('%', time + '');
      } else {
        this.timeAgo = format[1].replace('%', time + '');
      }
      return true;
    } else {
      return false;
    }
  }

}
