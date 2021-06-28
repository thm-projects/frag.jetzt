import { Comment } from '../models/comment';
import { CorrectWrong } from '../models/correct-wrong.enum';

export const enum FilterNames {
  read = 'read',
  unread = 'unread',
  favorite = 'favorite',
  correct = 'correct',
  wrong = 'wrong',
  bookmark = 'bookmark',
  answer = 'answer',
  unanswered = 'unanswered'
}

export enum Period {
  fromNow = 'from-now',
  oneHour = 'time-1h',
  threeHours = 'time-3h',
  oneDay = 'time-1d',
  oneWeek = 'time-1w',
  twoWeeks = 'time-2w',
  all = 'time-all'
}

export class CommentFilter {
  filterSelected = '';
  keywordSelected = '';
  tagSelected = '';
  userNumberSelected = 0;

  paused = false;
  timeStampUntil = 0;

  periodSet: Period = Period.twoWeeks;
  timeStampNow = 0;

  constructor(obj?: any) {
    if (obj) {
      this.filterSelected = obj.filterSelected;
      this.keywordSelected = obj.keywordSelected;
      this.tagSelected = obj.tagSelected;
      this.paused = obj.paused;
      this.timeStampUntil = obj.timeStampUntil;
      this.periodSet = obj.periodSet;
      this.timeStampNow = obj.timeStampNow;
      this.userNumberSelected = obj.userNumberSelected;
    }
  }

  public static set currentFilter(filter: CommentFilter) {
    localStorage.setItem('filter', JSON.stringify(filter));
  }

  public static get currentFilter(): CommentFilter {
    return new CommentFilter(JSON.parse(localStorage.getItem('filter')));
  }

  public static generateFilterNow(filterSelected: string): CommentFilter {
    const filter = new CommentFilter();

    filter.userNumberSelected = 0;
    filter.filterSelected = filterSelected;
    filter.paused = false;

    filter.tagSelected = '';
    filter.keywordSelected = '';

    filter.periodSet = Period.fromNow;
    filter.timeStampNow = new Date().getTime();

    return filter;
  }

  public static generateFilterUntil(filterSelected: string, periodSelected: Period, untilTime: number,
                                    tagSelected: string, keywordSelected: string): CommentFilter {
    const filter = new CommentFilter();


    filter.userNumberSelected = 0;
    filter.filterSelected = filterSelected;

    filter.paused = true;
    filter.timeStampUntil = untilTime;

    filter.tagSelected = tagSelected;
    filter.keywordSelected = keywordSelected;

    filter.periodSet = periodSelected;

    return filter;
  }

  public checkComment(com: Comment): boolean {
    return (this.checkPeriod(com) && this.checkFilters(com));
  }

  private checkPeriod(com: Comment): boolean {
    /* Filter by Period */
    const currentTime = new Date();
    const hourInSeconds = 3600000;
    let periodInSeconds;

    if (this.periodSet === Period.all) {
      return true;
    }

    switch (this.periodSet) {
      case Period.fromNow:
        break;
      case Period.oneHour:
        periodInSeconds = hourInSeconds;
        break;
      case Period.threeHours:
        periodInSeconds = hourInSeconds * 3;
        break;
      case Period.oneDay:
        periodInSeconds = hourInSeconds * 24;
        break;
      case Period.oneWeek:
        periodInSeconds = hourInSeconds * 168;
        break;
      case Period.twoWeeks:
        periodInSeconds = hourInSeconds * 336;
        break;
    }

    const commentTime = new Date(com.timestamp).getTime();

    if (this.periodSet === Period.fromNow) {
      return commentTime > this.timeStampNow;
    }

    if (this.paused) {
      return commentTime < this.timeStampUntil;
    }

    return commentTime > (currentTime.getTime() - periodInSeconds);
  }

  private checkFilters(com: Comment): boolean {
    if (this.filterSelected) {  // no filters => return true
      switch (this.filterSelected) {
        case FilterNames.correct:
          return com.correct === CorrectWrong.CORRECT;
        case FilterNames.wrong:
          return com.correct === CorrectWrong.WRONG;
        case FilterNames.favorite:
          return com.favorite;
        case FilterNames.bookmark:
          return com.bookmark;
        case FilterNames.read:
          return com.read;
        case FilterNames.unread:
          return !com.read;
        case FilterNames.answer:
          return com.answer !== '';
        case FilterNames.unanswered:
          return !com.answer;
      }
    }

    if (this.userNumberSelected !== 0) {
      return com.userNumber === this.userNumberSelected;
    }

    if (this.keywordSelected !== '') {
      return com.keywordsFromQuestioner.includes(this.keywordSelected);
    }

    if (this.tagSelected !== '') {
      return com.tag === this.tagSelected;
    }
    return true;
  }
}
