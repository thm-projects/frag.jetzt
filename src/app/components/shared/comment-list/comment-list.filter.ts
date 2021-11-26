import { Comment } from '../../../models/comment';
import { CorrectWrong } from '../../../models/correct-wrong.enum';
import { Room } from '../../../models/room';

export enum Period {
  fromNow = 'from-now',
  oneHour = 'time-1h',
  threeHours = 'time-3h',
  oneDay = 'time-1d',
  oneWeek = 'time-1w',
  twoWeeks = 'time-2w',
  all = 'time-all'
}

export enum FilterType {
  time = 'time',
  read = 'read',
  unread = 'unread',
  favorite = 'favorite',
  correct = 'correct',
  wrong = 'wrong',
  ack = 'ack',
  bookmark = 'bookmark',
  not_bookmarked = 'not_bookmarked',
  moderator = 'moderator',
  lecturer = 'lecturer',
  tag = 'tag',
  userNumber = 'userNumber',
  keyword = 'keyword',
  answer = 'answer',
  unanswered = 'unanswered',
  owner = 'owner',
}

export type FilterTypeKey = keyof typeof FilterType;

export enum SortType {
  score = 'score',
  time = 'time',
  controversy = 'controversy',
}

export type SortTypeKey = keyof typeof SortType;

const DEFAULT_PERIOD = Period.all;
const DEFAULT_SORT = SortType.time;
const DEFAULT_SORT_REVERSE = false;

export class CommentListFilter {
  //own properties
  period: Period;
  fromNow: number;
  freezedAt: number;
  filterType: FilterType;
  filterCompare: any;
  sortType: SortType;
  sortReverse: boolean;
  currentSearch: string;
  //dependencies to other values
  private userId: string;
  private moderatorIds: Set<string>;
  private threshold: number;
  private ownerId: string;
  private lastRoomId: string;

  constructor(obj) {
    if (!obj) {
      this.resetToDefault();
      return;
    }
    this.period = obj.period;
    this.fromNow = obj.fromNow;
    this.freezedAt = obj.freezedAt;
    this.filterType = obj.filterType;
    this.filterCompare = obj.filterCompare;
    this.sortType = obj.sortType;
    this.sortReverse = obj.sortReverse;
    this.currentSearch = obj.currentSearch;
    this.lastRoomId = obj.lastRoomId;
  }

  static loadFilter(name = 'currentFilter'): CommentListFilter {
    return new CommentListFilter(JSON.parse(localStorage.getItem(name)));
  }

  static calculateControversy(up = 0, down = 0, normalized = true): number {
    const summed = up + down;
    const stretch = 10;
    if (normalized) {
      if (summed === 0) {
        return 0;
      }
      return (summed - Math.abs(up - down)) * (1 - stretch / (summed + stretch)) / summed;
    } else {
      return (summed - Math.abs(up - down)) * (1 - stretch / (summed + stretch));
    }
  }

  resetToDefault() {
    this.period = DEFAULT_PERIOD;
    this.fromNow = null;
    this.freezedAt = null;
    this.filterType = null;
    this.filterCompare = null;
    this.sortType = DEFAULT_SORT;
    this.sortReverse = DEFAULT_SORT_REVERSE;
    this.currentSearch = '';
  }

  updateRoom(room: Room) {
    if (room.id !== this.lastRoomId) {
      this.resetToDefault();
    }
    this.ownerId = room.ownerId;
    this.lastRoomId = room.id;
    this.threshold = room.threshold;
  }

  updateUserId(userId: string) {
    this.userId = userId;
  }

  updateModerators(moderators: string[]) {
    this.moderatorIds = new Set<string>([...moderators]);
  }

  isReady(): boolean {
    return this.ownerId !== undefined && this.userId !== undefined && this.moderatorIds !== undefined;
  }

  save(name = 'currentFilter') {
    const ownerId = this.ownerId;
    const threshold = this.threshold;
    const userId = this.userId;
    const moderatorIds = this.moderatorIds;
    this.ownerId = this.threshold = this.userId = this.moderatorIds = undefined;
    localStorage.setItem(name, JSON.stringify(this));
    this.ownerId = ownerId;
    this.threshold = threshold;
    this.userId = userId;
    this.moderatorIds = moderatorIds;
  }

  get thresholdEnabled() {
    return !!this.threshold;
  }

  get moderatorAccountIds() {
    return this.moderatorIds;
  }

  checkAll(comments: Comment[], moderation = false): Comment[] {
    const filterComments = this.filterCommentsByTime(comments, moderation);
    if (this.currentSearch) {
      return this.filterCommentsBySearch(filterComments);
    }
    return this.sortCommentsBySortType(this.filterCommentsByType(filterComments));
  }

  checkAllWrapper<T>(comments: T[], accessFun: (t: T) => Comment, moderation = false): T[] {
    const filterComments = this.filterCommentWrapperByTime(comments, accessFun, moderation);
    if (this.currentSearch) {
      return this.filterCommentWrapperBySearch(filterComments, accessFun);
    }
    return this.sortCommentWrapperBySortType(this.filterCommentWrapperByType(filterComments, accessFun), accessFun);
  }

  filterCommentsBySearch(comments: Comment[]): Comment[] {
    return this.filterCommentWrapperBySearch(comments, c => c);
  }

  filterCommentWrapperBySearch<T>(comments: T[], accessFun: (t: T) => Comment): T[] {
    const search = this.currentSearch.toLowerCase();
    return comments
      .filter(c => {
        const com = accessFun(c);
        return com.body.toLowerCase().includes(search) ||
          com.answer?.toLowerCase().includes(search) ||
          com.keywordsFromSpacy?.some(e => e.text.toLowerCase().includes(search)) ||
          com.keywordsFromQuestioner?.some(e => e.text.toLowerCase().includes(search)) ||
          com.questionerName?.toLowerCase().includes(search);
      });
  }

  filterCommentsByTime(comments: Comment[], moderation = false): Comment[] {
    return this.filterCommentWrapperByTime(comments, c => c, moderation);
  }

  filterCommentWrapperByTime<T>(comments: T[], accessFun: (t: T) => Comment, moderation = false): T[] {
    const thresholdComments = this.thresholdEnabled && !moderation ?
      comments.filter(comment => accessFun(comment).score >= this.threshold) : comments;
    if (this.period === null || this.period === undefined) {
      this.period = DEFAULT_PERIOD;
    }
    if (this.period === Period.all) {
      return this.freezedAt ?
        thresholdComments.filter(c => new Date(accessFun(c).timestamp).getTime() < this.freezedAt) :
        thresholdComments;
    }
    const currentTime = new Date().getTime();
    let periodInSeconds;
    const hourInSeconds = 3_600_000;
    switch (this.period) {
      case Period.fromNow:
        if (!this.fromNow) {
          this.fromNow = currentTime;
        }
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
      default:
        throw new Error('Time period is invalid.');
    }
    const filterTime = (this.period === Period.fromNow ? this.fromNow : currentTime - periodInSeconds);
    return thresholdComments.filter(c => {
      const time = new Date(accessFun(c).timestamp).getTime();
      return time >= filterTime && (!this.freezedAt || time < this.freezedAt);
    });
  }

  filterCommentsByType(comment: Comment[]): Comment[] {
    return this.filterCommentWrapperByType(comment, c => c);
  }

  filterCommentWrapperByType<T>(comment: T[], accessFun: (t: T) => Comment): T[] {
    let filterFunc: (c: Comment) => boolean;
    switch (this.filterType) {
      case FilterType.correct:
        filterFunc = (c) => c.correct === CorrectWrong.CORRECT;
        break;
      case FilterType.wrong:
        filterFunc = (c) => c.correct === CorrectWrong.WRONG;
        break;
      case FilterType.favorite:
        filterFunc = (c) => c.favorite;
        break;
      case FilterType.bookmark:
        filterFunc = (c) => c.bookmark;
        break;
      case FilterType.not_bookmarked:
        filterFunc = (c) => !c.bookmark;
        break;
      case FilterType.read:
        filterFunc = (c) => c.read;
        break;
      case FilterType.unread:
        filterFunc = (c) => !c.read;
        break;
      case FilterType.tag:
        filterFunc = (c) => c.tag === this.filterCompare;
        break;
      case FilterType.userNumber:
        filterFunc = (c) => c.userNumber === this.filterCompare;
        break;
      case FilterType.keyword:
        filterFunc = (c) => !!(c.keywordsFromQuestioner?.find(k => k.text === this.filterCompare) ||
          c.keywordsFromSpacy?.find(k => k.text === this.filterCompare));
        break;
      case FilterType.answer:
        filterFunc = (c) => !!c.answer;
        break;
      case FilterType.unanswered:
        filterFunc = (c) => !c.answer;
        break;
      case FilterType.owner:
        filterFunc = (c) => c.creatorId === this.userId;
        break;
      case FilterType.moderator:
        filterFunc = (c) => this.moderatorIds.has(c.creatorId);
        break;
      case FilterType.lecturer:
        filterFunc = (c) => c.creatorId === this.ownerId;
        break;
      default:
        return comment;
    }
    return comment.filter(c => filterFunc(accessFun(c)));
  }

  sortCommentsBySortType(comments: Comment[]): Comment[] {
    return this.sortCommentWrapperBySortType(comments, c => c);
  }

  sortCommentWrapperBySortType<T>(comments: T[], accessFun: (t: T) => Comment): T[] {
    let sortFunc: (a: Comment, b: Comment) => number;
    switch (this.sortType) {
      case SortType.score:
        sortFunc = (a, b) => b.score - a.score;
        break;
      case SortType.time:
        sortFunc = (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        break;
      case SortType.controversy:
        sortFunc = (a, b) => CommentListFilter.calculateControversy(b.upvotes, b.downvotes) -
          CommentListFilter.calculateControversy(a.upvotes, a.downvotes);
    }
    if (sortFunc) {
      comments.sort((a, b) => sortFunc(accessFun(a), accessFun(b)));
    }
    if (this.sortReverse) {
      comments.reverse();
    }
    comments.sort((a, b) => this.getCommentRoleValue(accessFun(b)) - this.getCommentRoleValue(accessFun(a)));
    return comments;
  }

  private getCommentRoleValue(comment: Comment): number {
    if (comment.creatorId === this.ownerId) {
      return 2;
    } else if (this.moderatorIds.has(comment.creatorId)) {
      return 1;
    }
    return 0;
  }
}
