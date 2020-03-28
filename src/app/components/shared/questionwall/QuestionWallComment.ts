import { Comment } from '../../../models/comment';

export class QuestionWallComment {

  public date: Date;
  public timeAgo: string;

  constructor(
    public comment: Comment,
    public old: boolean
  ) {
    this.date = new Date(comment.timestamp);
    this.updateTimeAgo();
  }

  public update() {
    console.log('update');
  }

  public updateTimeAgo() {
    const seconds = Math.floor((new Date().getTime() - this.date.getTime()) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(months / 12);
    if (this.setTimeAgo(years, 'year')) {return; }
    if (this.setTimeAgo(months, 'month')) {return; }
    if (this.setTimeAgo(days, 'day')) {return; }
    if (this.setTimeAgo(hours, 'hour')) {return; }
    if (this.setTimeAgo(minutes, 'minute')) {return; }
    if (this.setTimeAgo(seconds, 'second')) {return; }
    this.timeAgo = '1 second ago';
  }

  private setTimeAgo(time: number, name: string): boolean {
    if (time > 0) {
      if (time === 1) {
        this.timeAgo = time + ' ' + name + ' ago';
      } else {
        this.timeAgo = time + ' ' + name + 's ago';
      }
      return true;
    } else {
      return false;
    }
  }

}
