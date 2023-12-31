export enum Period {
  FromNow = 'FromNow',
  OneHour = 'OneHour',
  ThreeHours = 'ThreeHours',
  OneDay = 'OneDay',
  OneWeek = 'OneWeek',
  TwoWeeks = 'TwoWeeks',
  All = 'All',
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
  AnsweredModerator = 'AnsweredModerator',
  AnsweredCreator = 'AnsweredCreator',
  Unanswered = 'Unanswered',
  Owner = 'Owner',
  Number = 'Number',
  Censored = 'Censored',
  Conversation = 'Conversation',
  BrainstormingIdea = 'BrainstormingIdea',
  Approved = 'Approved',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  ChatGPT = 'ChatGPT',
}

export type FilterTypeKey = keyof typeof FilterType;

export enum BrainstormingFilter {
  OnlyBrainstorming = 'OnlyBrainstorming',
  ExceptBrainstorming = 'ExceptBrainstorming',
}

export enum AcknowledgementFilter {
  OnlyAcknowledged = 'OnlyAcknowledged',
  ExceptAcknowledged = 'ExceptAcknowledged',
}

export const isMultiLevelFilter = (filter: FilterType) => {
  const obj = {
    [FilterType.Keyword]: true,
  };
  return Boolean(obj[filter]);
};

export enum SortType {
  Score = 'Score',
  Time = 'Time',
  Controversy = 'Controversy',
  Commented = 'Commented',
}

export type SortTypeKey = keyof typeof SortType;

export type FilterTypes =
  | 'commentList'
  | 'presentation'
  | 'tagCloud'
  | 'brainstorming'
  | 'moderatorList'
  | 'children'
  | 'dummy';

type DefaultData = Pick<
  RoomDataFilter,
  | 'period'
  | 'timeFilterStart'
  | 'frozenAt'
  | 'filterType'
  | 'filterCompare'
  | 'sortType'
  | 'sortReverse'
  | 'ignoreThreshold'
  | 'ignoreRoleSort'
  | 'currentSearch'
  | 'sourceFilterBrainstorming'
  | 'sourceFilterAcknowledgement'
>;

const DEFAULTS: { [key in FilterTypes]: DefaultData } = {
  commentList: {
    period: Period.All,
    timeFilterStart: Date.now(),
    frozenAt: null,
    filterType: null,
    filterCompare: null,
    sortType: SortType.Time,
    sortReverse: false,
    ignoreThreshold: false,
    ignoreRoleSort: false,
    currentSearch: '',
    sourceFilterAcknowledgement: null,
    sourceFilterBrainstorming: BrainstormingFilter.ExceptBrainstorming,
  },
  moderatorList: {
    period: Period.All,
    timeFilterStart: Date.now(),
    frozenAt: null,
    filterType: null,
    filterCompare: null,
    sortType: SortType.Time,
    sortReverse: false,
    ignoreThreshold: true,
    ignoreRoleSort: false,
    currentSearch: '',
    sourceFilterAcknowledgement: AcknowledgementFilter.ExceptAcknowledged,
    sourceFilterBrainstorming: null,
  },
  presentation: {
    period: Period.All,
    timeFilterStart: Date.now(),
    frozenAt: null,
    filterType: null,
    filterCompare: null,
    sortType: SortType.Score,
    sortReverse: false,
    ignoreThreshold: false,
    ignoreRoleSort: true,
    currentSearch: '',
    sourceFilterAcknowledgement: null,
    sourceFilterBrainstorming: BrainstormingFilter.ExceptBrainstorming,
  },
  tagCloud: {
    period: Period.All,
    timeFilterStart: Date.now(),
    frozenAt: null,
    filterType: null,
    filterCompare: null,
    sortType: SortType.Time,
    sortReverse: false,
    ignoreThreshold: false,
    ignoreRoleSort: false,
    currentSearch: '',
    sourceFilterAcknowledgement: null,
    sourceFilterBrainstorming: BrainstormingFilter.ExceptBrainstorming,
  },
  brainstorming: {
    period: Period.FromNow,
    timeFilterStart: Date.now(),
    frozenAt: null,
    filterType: null,
    filterCompare: null,
    sortType: SortType.Time,
    sortReverse: false,
    ignoreThreshold: false,
    ignoreRoleSort: false,
    currentSearch: '',
    sourceFilterAcknowledgement: null,
    sourceFilterBrainstorming: BrainstormingFilter.OnlyBrainstorming,
  },
  children: {
    period: Period.All,
    timeFilterStart: Date.now(),
    frozenAt: null,
    filterType: null,
    filterCompare: null,
    sortType: SortType.Time,
    sortReverse: true,
    ignoreThreshold: false,
    ignoreRoleSort: false,
    currentSearch: '',
    sourceFilterAcknowledgement: null,
    sourceFilterBrainstorming: BrainstormingFilter.ExceptBrainstorming,
  },
  dummy: {
    period: Period.All,
    timeFilterStart: Date.now(),
    frozenAt: null,
    filterType: null,
    filterCompare: null,
    sortType: SortType.Time,
    sortReverse: false,
    ignoreThreshold: false,
    ignoreRoleSort: false,
    currentSearch: '',
    sourceFilterAcknowledgement: null,
    sourceFilterBrainstorming: BrainstormingFilter.ExceptBrainstorming,
  },
};

export class RoomDataFilter {
  period: Period;
  timeFilterStart: number;
  frozenAt: number;
  filterType: FilterType;
  filterCompare: unknown;
  sortType: SortType;
  sortReverse: boolean;
  ignoreThreshold: boolean;
  ignoreRoleSort: boolean;
  currentSearch: string;
  lastRoomId: string;
  sourceFilterBrainstorming: BrainstormingFilter;
  sourceFilterAcknowledgement: AcknowledgementFilter;

  private constructor(
    public readonly name: FilterTypes,
    obj: Partial<RoomDataFilter>,
  ) {
    if (!obj) {
      this.resetToDefault();
      return;
    }
    this.period = obj.period;
    this.timeFilterStart = obj.timeFilterStart;
    this.frozenAt = obj.frozenAt;
    this.filterType = obj.filterType;
    this.filterCompare = obj.filterCompare;
    this.sortType = obj.sortType;
    this.sortReverse = obj.sortReverse;
    this.ignoreThreshold = obj.ignoreThreshold;
    this.ignoreRoleSort = obj.ignoreRoleSort;
    this.currentSearch = obj.currentSearch;
    this.lastRoomId = obj.lastRoomId;
    this.sourceFilterBrainstorming = obj.sourceFilterBrainstorming;
    this.sourceFilterAcknowledgement = obj.sourceFilterAcknowledgement;
  }

  static clone(filter: RoomDataFilter): RoomDataFilter {
    return new RoomDataFilter(filter.name, filter);
  }

  static loadFilter(name: FilterTypes): RoomDataFilter {
    return new RoomDataFilter(name, JSON.parse(sessionStorage.getItem(name)));
  }

  save() {
    sessionStorage.setItem(this.name, JSON.stringify(this));
  }

  checkRoom(roomId: string): boolean {
    const changed = roomId !== this.lastRoomId;
    if (changed) {
      this.resetToDefault();
    }
    if (this.period === null || this.period === undefined) {
      this.period = DEFAULTS[this.name].period;
    }
    this.lastRoomId = roomId;
    return changed;
  }

  applyOptions(forceOptions: Partial<RoomDataFilter>) {
    for (const key of Object.keys(forceOptions)) {
      if (key === 'name') {
        continue;
      }
      this[key] = forceOptions[key];
    }
  }

  resetToDefault() {
    const obj = DEFAULTS[this.name];
    for (const key of Object.keys(obj)) {
      this[key] = obj[key];
    }
  }
}
