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
  voteasc = 'voteasc',
  votedesc = 'votedesc',
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
  voteasc = 'voteasc',
  votedesc = 'votedesc',
  time = 'time',
  controversy = 'controversy',
}

export type SortTypeKey = keyof typeof SortType;

const DEFAULT_PERIOD = Period.all;
const DEFAULT_SORT = SortType.time;

export class CommentListFilter {
  //own properties
  period: Period;
  fromNow: number;
  freezedAt: number;
  filterType: FilterType;
  filterCompare: any;
  sortType: SortType;
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

  filterCommentsBySearch(comments: Comment[]): Comment[] {
    const search = this.currentSearch.toLowerCase();
    return comments
      .filter(c =>
        c.body.toLowerCase().includes(search) ||
        c.answer?.toLowerCase().includes(search) ||
        c.keywordsFromSpacy?.some(e => e.text.toLowerCase().includes(search)) ||
        c.keywordsFromQuestioner?.some(e => e.text.toLowerCase().includes(search)) ||
        c.questionerName?.toLowerCase().includes(search)
      );
  }

  filterCommentsByTime(comments: Comment[], moderation = false): Comment[] {
    const thresholdComments =
      this.thresholdEnabled && !moderation ? comments.filter(comment => comment.score >= this.threshold) : comments;
    if (this.period === null || this.period === undefined) {
      this.period = DEFAULT_PERIOD;
    }
    if (this.period === Period.all) {
      return this.freezedAt ?
        thresholdComments.filter(c => new Date(c.timestamp).getTime() < this.freezedAt) :
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
      const time = new Date(c.timestamp).getTime();
      return time >= filterTime && (!this.freezedAt || time < this.freezedAt);
    });
  }

  filterCommentsByType(comment: Comment[]): Comment[] {
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
    return comment.filter(filterFunc);
  }

  sortCommentsBySortType(comments: Comment[]): Comment[] {
    let sortFunc: (a: Comment, b: Comment) => number;
    switch (this.sortType) {
      case SortType.voteasc:
        sortFunc = (a, b) => a.score - b.score;
        break;
      case SortType.votedesc:
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
      comments.sort(sortFunc);
    }
    comments.sort((a, b) => this.getCommentRoleValue(b) - this.getCommentRoleValue(a));
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
