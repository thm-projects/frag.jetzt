export enum Period {
  FromNow = 'FromNow',
  OneHour = 'OneHour',
  ThreeHours = 'ThreeHours',
  OneDay = 'OneDay',
  OneWeek = 'OneWeek',
  TwoWeeks = 'TwoWeeks',
  All = 'All'
}

export type PeriodKey = keyof typeof Period;

export enum FilterType {
  Time = 'Time',
  Read = 'Read',
  Unread = 'Unread',
  Favorite = 'Favorite',
  Correct = 'Correct',
  Wrong = 'Wrong',
  Ack = 'Ack',
  Bookmark = 'Bookmark',
  NotBookmarked = 'NotBookmarked',
  Moderator = 'Moderator',
  Lecturer = 'Lecturer',
  Tag = 'Tag',
  CreatorId = 'CreatorId',
  Keyword = 'Keyword',
  Answer = 'Answer',
  Unanswered = 'Unanswered',
  Owner = 'Owner',
  Number = 'Number',
  BrainstormingQuestion = 'BrainstormingQuestion',
  Censored = 'Censored'
}

export type FilterTypeKey = keyof typeof FilterType;

export enum SortType {
  Score = 'Score',
  Time = 'Time',
  Controversy = 'Controversy',
}

export type SortTypeKey = keyof typeof SortType;

export const DEFAULT_PERIOD = Period.All;
const DEFAULT_SORT = SortType.Time;
const DEFAULT_SORT_REVERSE = false;

export type FilterTypes = 'commentList' | 'presentation' | 'tagCloud' | 'moderatorList';

export class RoomDataFilter {

  period: Period;
  fromNow: number;
  freezedAt: number;
  filterType: FilterType;
  filterCompare: any;
  sortType: SortType;
  sortReverse: boolean;
  moderation: boolean;
  ignoreRoleSort: boolean;
  currentSearch: string;
  lastRoomId: string;

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
    this.moderation = obj.moderation;
    this.ignoreRoleSort = obj.ignoreRoleSort;
    this.currentSearch = obj.currentSearch;
    this.lastRoomId = obj.lastRoomId;
  }

  static loadFilter(name: string): RoomDataFilter {
    return new RoomDataFilter(JSON.parse(sessionStorage.getItem(name)));
  }

  save(name: string) {
    sessionStorage.setItem(name, JSON.stringify(this));
  }

  checkRoom(roomId: string): boolean {
    const changed = roomId !== this.lastRoomId;
    if (changed) {
      this.resetToDefault();
    }
    if (this.period === null || this.period === undefined) {
      this.period = DEFAULT_PERIOD;
    }
    this.lastRoomId = roomId;
    return changed;
  }


  resetToDefault() {
    this.period = DEFAULT_PERIOD;
    this.fromNow = null;
    this.freezedAt = null;
    this.filterType = null;
    this.filterCompare = null;
    this.sortType = DEFAULT_SORT;
    this.sortReverse = DEFAULT_SORT_REVERSE;
    this.moderation = false;
    this.ignoreRoleSort = false;
    this.currentSearch = '';
  }

}
