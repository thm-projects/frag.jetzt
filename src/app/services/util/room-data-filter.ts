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
  creatorId = 'creatorId',
  keyword = 'keyword',
  answer = 'answer',
  unanswered = 'unanswered',
  owner = 'owner',
  number = 'number',
  brainstormingQuestion = 'brainstormingQuestion'
}

export type FilterTypeKey = keyof typeof FilterType;

export enum SortType {
  score = 'score',
  time = 'time',
  controversy = 'controversy',
}

export type SortTypeKey = keyof typeof SortType;

export const DEFAULT_PERIOD = Period.all;
const DEFAULT_SORT = SortType.time;
const DEFAULT_SORT_REVERSE = false;

type FilterTypes = 'commentList' | 'presentation' | 'tagCloud' | 'moderatorList';

export class RoomDataFilter {

  period: Period;
  fromNow: number;
  freezedAt: number;
  filterType: FilterType;
  filterCompare: any;
  sortType: SortType;
  sortReverse: boolean;
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
    this.currentSearch = obj.currentSearch;
    this.lastRoomId = obj.lastRoomId;
  }

  static loadFilter(name: FilterTypes): RoomDataFilter {
    return new RoomDataFilter(JSON.parse(sessionStorage.getItem(name)));
  }

  save(name: FilterTypes) {
    sessionStorage.setItem(name, JSON.stringify(this));
  }

  checkRoom(roomId: string): boolean {
    const changed = roomId !== this.lastRoomId;
    if (changed) {
      this.resetToDefault();
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
    this.currentSearch = '';
  }

}
