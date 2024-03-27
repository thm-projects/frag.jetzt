import {
  AcknowledgementFilter,
  BrainstormingFilter,
  FilterType,
  FilterTypes,
  Period,
  RoomDataFilter,
  SortType,
} from './data-filter-object.lib';
import { DataAccessor, ForumComment } from './data-accessor';
import {
  BehaviorSubject,
  Observable,
  of,
  Subject,
  Subscription,
  takeUntil,
} from 'rxjs';
import { RoomDataService } from '../services/util/room-data.service';
import { SpacyKeyword } from '../services/http/spacy.service';
import { CorrectWrong } from '../models/correct-wrong.enum';
import { Comment } from '../models/comment';
import { SessionService } from '../services/util/session.service';
import { Room } from '../models/room';
import { filter } from 'rxjs/operators';

interface AttachOptions {
  roomId: string;
  ownerId: string;
  threshold: number;
  userId: string;
  moderatorIds: Set<string>;
}

const UPDATE_ALL = -1;
const STAGE_PREFILTER = 1 << 0;
const STAGE_PERIOD = 1 << 1;
const STAGE_SEARCH = 1 << 2;
const STAGE_FILTER = 1 << 3;
const STAGE_SORT_SEARCH = 1 << 4;
const STAGE_SORT_FILTER = 1 << 5;

// Period definitions
type PeriodCache = { [key in Period]: ForumComment[] };
export type PeriodCounts = { [key in Period]: number };
type PeriodFunctions = {
  [key in Period]: (currentTime: number, comment: ForumComment) => boolean;
};
const hourInSeconds = 3_600_000;
const threeHoursInSeconds = 3 * hourInSeconds;
const oneDayInSeconds = 24 * hourInSeconds;
const oneWeekInSeconds = 7 * oneDayInSeconds;
const twoWeekInSeconds = 2 * oneWeekInSeconds;
const periodFunctions: PeriodFunctions = {
  [Period.FromNow]: (time, c) => new Date(c.createdAt).getTime() >= time,
  [Period.OneHour]: (time, c) =>
    new Date(c.createdAt).getTime() >= time - hourInSeconds,
  [Period.ThreeHours]: (time, c) =>
    new Date(c.createdAt).getTime() >= time - threeHoursInSeconds,
  [Period.OneDay]: (time, c) =>
    new Date(c.createdAt).getTime() >= time - oneDayInSeconds,
  [Period.OneWeek]: (time, c) =>
    new Date(c.createdAt).getTime() >= time - oneWeekInSeconds,
  [Period.TwoWeeks]: (time, c) =>
    new Date(c.createdAt).getTime() >= time - twoWeekInSeconds,
  [Period.All]: () => true,
};

// Filter definitions
type FilterTypeCache = { [key in FilterType]: ForumComment[] };
export type FilterTypeCounts = { [key in FilterType]: number };
type FilterFunction = (c: ForumComment, compareValue?: unknown) => boolean;
type FilterFunctionObject = {
  [key in FilterType]?: FilterFunction;
};

const needFilterCompare: Set<FilterType> = new Set<FilterType>([
  FilterType.Tag,
  FilterType.CreatorId,
  FilterType.Keyword,
  FilterType.Number,
]);

// Sort definitions
type SortFunctionsObject = {
  [key in SortType]?: (a: ForumComment, b: ForumComment) => number;
};

export const calculateControversy = (
  up: number,
  down: number,
  responses: number,
): number => {
  const summed = up + down;
  const stretch = 10;
  const responseWeight = 0.2;
  return (
    (summed - Math.abs(up - down)) *
    (1 - stretch / (summed + stretch)) *
    (1 + responseWeight * responses)
  );
};

const sortFunctions: SortFunctionsObject = {
  [SortType.Score]: (a, b) => b.score - a.score,
  [SortType.Time]: (a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  [SortType.Controversy]: (a, b) =>
    calculateControversy(
      b.upvotes,
      b.downvotes,
      b.totalAnswerCounts.accumulated,
    ) -
    calculateControversy(
      a.upvotes,
      a.downvotes,
      a.totalAnswerCounts.accumulated,
    ),
  [SortType.Commented]: (a, b) =>
    b.totalAnswerCounts.accumulated - a.totalAnswerCounts.accumulated,
};

const getCommentRoleValue = (
  comment: Comment,
  ownerId: string,
  moderatorIds: Set<string>,
): number => {
  if (comment.creatorId === ownerId) {
    return 2;
  } else if (moderatorIds.has(comment.creatorId)) {
    return 1;
  }
  return 0;
};

export const getMultiLevelFilterParent = (
  parentComment: ForumComment,
  func: FilterFunction,
  compareValue?: unknown,
): [level: number, parent: ForumComment] => {
  const getHighestElement = (
    comment: ForumComment,
    i = 1,
  ): [level: number, parent: ForumComment] => {
    for (const child of comment.children) {
      if (func(child, compareValue)) {
        return [i, comment];
      }
    }
    let highestCount = null;
    let highestCountParent = null;
    for (const child of comment.children) {
      const result = getHighestElement(child, i + 1);
      if (!result) {
        continue;
      }
      if (!highestCount) {
        highestCount = result[0];
        highestCountParent = result[1];
        continue;
      }
      if (result[0] > highestCount) {
        // Already got a higher parent, ignore children
        continue;
      }
      if (result[0] < highestCount) {
        // found a better parent
        highestCount = result[0];
        highestCountParent = result[1];
        continue;
      }
      // found similar parents, step one hierarchy up
      highestCount = highestCount - 1;
      highestCountParent = result[1].parent;
    }
    if (highestCountParent) {
      return [highestCount, highestCountParent];
    }
    return null;
  };
  return getHighestElement(parentComment);
};

export const hasKeyword: FilterFunction = (c, value) =>
  Boolean(
    c.keywordsFromQuestioner?.find((keyword) => keyword.text === value) ||
      c.keywordsFromSpacy?.find((keyword) => keyword.text === value),
  );

export class FilteredDataAccess {
  private readonly filterFunctions: FilterFunctionObject = {
    [FilterType.Correct]: (c) => c.correct === CorrectWrong.CORRECT,
    [FilterType.Wrong]: (c) => c.correct === CorrectWrong.WRONG,
    [FilterType.Favorite]: (c) => Boolean(c.favorite),
    [FilterType.Bookmark]: (c) => Boolean(c.bookmark),
    [FilterType.NotBookmarked]: (c) => !c.bookmark,
    [FilterType.Read]: (c) => Boolean(c.read),
    [FilterType.Unread]: (c) => !c.read,
    [FilterType.Tag]: (c, value) => c.tag === value,
    [FilterType.CreatorId]: (c, value) => c.creatorId === value,
    [FilterType.Keyword]: (c, value) =>
      hasKeyword(c, value) ||
      (!this._isRaw
        ? getMultiLevelFilterParent(c, hasKeyword, value) !== null
        : false),
    [FilterType.AnsweredCreator]: (c) => c.totalAnswerCounts.fromCreator > 0,
    [FilterType.AnsweredModerator]: (c) =>
      c.totalAnswerCounts.fromModerators > 0,
    [FilterType.Unanswered]: (c) =>
      c.totalAnswerCounts.fromCreator < 1 &&
      c.totalAnswerCounts.fromModerators < 1,
    [FilterType.Owner]: (c) => c.creatorId === this._settings.userId,
    [FilterType.Moderator]: (c) =>
      this._settings.moderatorIds.has(c.creatorId) ||
      c.creatorId === this._settings.ownerId,
    [FilterType.Number]: (c, value) => c.number === value,
    [FilterType.Censored]: (c) => this._profanityChecker(c),
    [FilterType.Conversation]: (c) => c.totalAnswerCounts.accumulated > 0,
    [FilterType.BrainstormingIdea]: (c, value) =>
      Array.isArray(value) && value?.includes?.(c.brainstormingWordId),
    [FilterType.Approved]: (c) =>
      c.approved ||
      (!this._isRaw
        ? getMultiLevelFilterParent(c, (comment) => comment.approved) !== null
        : false),
    [FilterType.ChatGPT]: (c) =>
      c.gptWriterState > 0 ||
      (!this._isRaw
        ? getMultiLevelFilterParent(
            c,
            (comment) => comment.gptWriterState > 0,
          ) !== null
        : false),
  } as const;
  // general properties
  private _settings: AttachOptions = null;
  private _destroyNotifier: Subject<unknown>;
  private _dataSubscription: Subscription;
  // stage caches
  private _tempData: ForumComment[];
  private _preFilteredData: ForumComment[];
  private _periodCache: PeriodCache;
  private _searchData: ForumComment[];
  private _sortedSearchData: ForumComment[];
  private _filterTypeCache: FilterTypeCache;
  private _sortedFilteredData: ForumComment[];
  // current data
  private _currentData: BehaviorSubject<Readonly<ForumComment[]>>;

  private constructor(
    public readonly dataAccessFunction: (
      frozen: boolean,
    ) => Observable<ForumComment[]>,
    private _isRaw: boolean,
    private _filter: RoomDataFilter,
    private _profanityChecker: (comment: ForumComment) => boolean,
    private readonly _onAttach?: (destroyer: Subject<unknown>) => void,
  ) {}

  get dataFilter() {
    return RoomDataFilter.clone(this._filter);
  }

  set dataFilter(roomDataFilter: RoomDataFilter) {
    const func = this.calculateChanges(this._filter, roomDataFilter);
    this._filter = roomDataFilter;
    func();
  }

  static buildChildrenAccess(
    sessionService: SessionService,
    dataService: RoomDataService,
    commentId: string,
  ): FilteredDataAccess {
    let dataAccessor = dataService.dataAccessor;
    let data = dataAccessor.getDataById(commentId);
    if (data === null) {
      dataAccessor = dataService.moderatorDataAccessor;
      data = dataAccessor.getDataById(commentId);
    }
    if (data == null) {
      return null;
    }
    const access = new FilteredDataAccess(
      () => of([...data.comment.children]),
      false,
      RoomDataFilter.loadFilter('children'),
      (c) => dataAccessor.getDataById(c.id).hasProfanity,
      (destroyer) => {
        this.constructAttachment(
          destroyer,
          sessionService,
          dataAccessor,
          access,
        );
        this.constructChildrenAttachment(
          destroyer,
          dataAccessor,
          data.comment,
          access,
        );
      },
    );
    return access;
  }

  static buildModeratedAccess(
    sessionService: SessionService,
    dataService: RoomDataService,
    raw: boolean,
    name: FilterTypes,
  ): FilteredDataAccess {
    const dataAccessor = dataService.moderatorDataAccessor;
    const access = new FilteredDataAccess(
      raw
        ? dataAccessor.getRawComments.bind(dataAccessor)
        : dataAccessor.getForumComments.bind(dataAccessor),
      raw,
      RoomDataFilter.loadFilter(name),
      (comment) => dataAccessor.getDataById(comment.id).hasProfanity,
      (destroyer) =>
        this.constructAttachment(
          destroyer,
          sessionService,
          dataAccessor,
          access,
        ),
    );
    return access;
  }

  static buildNormalAccess(
    sessionService: SessionService,
    dataService: RoomDataService,
    raw: boolean,
    name: FilterTypes,
    forceOptions?: Partial<RoomDataFilter>,
  ): FilteredDataAccess {
    const roomDataFilter = RoomDataFilter.loadFilter(name);
    if (forceOptions) {
      roomDataFilter.applyOptions(forceOptions);
    }
    const dataAccessor = dataService.dataAccessor;
    const access = new FilteredDataAccess(
      raw
        ? dataAccessor.getRawComments.bind(dataAccessor)
        : dataAccessor.getForumComments.bind(dataAccessor),
      raw,
      roomDataFilter,
      (comment) => dataAccessor.getDataById(comment.id).hasProfanity,
      (destroyer) =>
        this.constructAttachment(
          destroyer,
          sessionService,
          dataAccessor,
          access,
        ),
    );
    return access;
  }

  private static constructChildrenAttachment(
    destroyer: Subject<unknown>,
    dataAccessor: DataAccessor,
    comment: ForumComment,
    access: FilteredDataAccess,
  ) {
    const changes = new Set<string>();
    dataAccessor
      .receiveUpdates([
        { type: 'CommentCreated', finished: true },
        { type: 'CommentDeleted', finished: false },
      ])
      .pipe(takeUntil(destroyer))
      .subscribe((info) => {
        if (
          info.type === 'CommentCreated' &&
          comment.children.has(info.comment)
        ) {
          access.updateDataSubscription();
        } else if (
          info.type === 'CommentDeleted' &&
          comment.children.has(info.comment)
        ) {
          changes.add(info.comment.id);
        }
      });
    dataAccessor
      .receiveUpdates([{ type: 'CommentDeleted', finished: true }])
      .pipe(takeUntil(destroyer))
      .subscribe((info) => {
        if (changes.delete(info.comment.id)) {
          access.updateDataSubscription();
        }
      });
  }

  private static constructAttachment(
    destroyer: Subject<unknown>,
    sessionService: SessionService,
    dataAccessor: DataAccessor,
    access: FilteredDataAccess,
  ) {
    dataAccessor
      .receiveUpdates([{ type: 'CommentPatched', finished: true }])
      .pipe(takeUntil(destroyer))
      .subscribe((info) => {
        if (info.type === 'CommentPatched' && info.finished) {
          const filterType = access._filter.filterType;
          if (
            access._tempData.find((e) => e.id === info.comment.id) !==
              undefined &&
            this.hasChanges(filterType, info.updates)
          ) {
            access.updateStages(STAGE_FILTER & STAGE_SORT_FILTER);
          }
        }
      });
    let hasChange = false;
    sessionService
      .receiveRoomUpdates(true)
      .pipe(takeUntil(destroyer))
      .subscribe((data) => {
        const keys = Object.keys(data) as (keyof Room)[];
        hasChange = keys.includes('threshold');
        const filterType = access._filter.filterType;
        if (
          filterType === FilterType.Censored &&
          keys.includes('profanityFilter')
        ) {
          access.updateStages(STAGE_FILTER & STAGE_SORT_FILTER);
          hasChange = false;
        }
      });
    sessionService
      .receiveRoomUpdates()
      .pipe(takeUntil(destroyer))
      .subscribe(() => {
        if (hasChange) {
          hasChange = false;
          access.updateStages(UPDATE_ALL);
        }
      });
  }

  private static hasChanges(
    filterType: FilterType,
    updates: (keyof Comment)[],
  ) {
    return (
      ([FilterType.Correct, FilterType.Wrong].includes(filterType) &&
        updates.includes('correct')) ||
      (filterType === FilterType.Favorite && updates.includes('favorite')) ||
      ([FilterType.Bookmark, FilterType.NotBookmarked].includes(filterType) &&
        updates.includes('bookmark')) ||
      ([FilterType.Read, FilterType.Unread].includes(filterType) &&
        updates.includes('read')) ||
      (filterType === FilterType.Tag && updates.includes('tag')) ||
      (filterType === FilterType.Keyword &&
        (['keywordsFromQuestioner', 'keywordsFromSpacy'] as const).some((e) =>
          updates.includes(e),
        )) ||
      (filterType === FilterType.Censored &&
        (['keywordsFromQuestioner', 'keywordsFromSpacy', 'body'] as const).some(
          (e) => updates.includes(e),
        ))
    );
  }

  private static periodKeys(): (keyof typeof Period)[] {
    return [
      Period.FromNow,
      Period.OneHour,
      Period.ThreeHours,
      Period.OneDay,
      Period.OneWeek,
      Period.TwoWeeks,
      Period.All,
    ];
  }

  getFilteredData(): Observable<Readonly<ForumComment[]>> {
    if (this._settings == null) {
      throw new Error('FilteredDataAccess not initialized!');
    }
    return this._currentData.pipe(filter((v) => Boolean(v)));
  }

  getCurrentData(): Readonly<ForumComment[]> {
    return this._currentData.value;
  }

  getSourceData(): Readonly<ForumComment[]> {
    return this._tempData;
  }

  getCurrentPeriodCount() {
    return this.getPeriodCount(this._filter.period);
  }

  getPeriodCount(period: Period): number {
    return this._periodCache[period].length;
  }

  getPeriodCounts(): PeriodCounts {
    const counts = {} as PeriodCounts;
    for (const key of Object.keys(this._periodCache)) {
      counts[key] = this._periodCache[key].length;
    }
    return counts;
  }

  getCurrentFilterTypeCount() {
    return this.getFilterTypeCount(this._filter.filterType);
  }

  getFilterTypeCount(filterType: FilterType): number {
    return this._filterTypeCache[filterType].length;
  }

  getFilterTypeCounts(): FilterTypeCounts {
    const counts = {} as FilterTypeCounts;
    for (const key of Object.keys(this._filterTypeCache)) {
      counts[key] = this._filterTypeCache[key].length;
    }
    return counts;
  }

  attach(options: AttachOptions) {
    this.detach();
    this._settings = options;
    if (this._settings.roomId === null || this._settings.roomId === undefined) {
      // comment
      this._filter.resetToDefault();
    } else {
      this._filter.checkRoom(this._settings.roomId);
    }
    this.updateDataSubscription();
    this?._onAttach(this._destroyNotifier);
  }

  detach(save = false) {
    if (save) {
      this._filter?.save();
    }
    this._settings = null;
    this._dataSubscription?.unsubscribe();
    this._destroyNotifier?.next(true);
    this._destroyNotifier?.complete();
    this._destroyNotifier = new Subject();
    this._currentData?.complete();
    this._currentData = new BehaviorSubject(null);
    this._tempData = null;
    this._preFilteredData = null;
    this._periodCache = null;
    this._searchData = null;
    this._sortedSearchData = null;
    this._filterTypeCache = null;
    this._sortedFilteredData = null;
  }

  updateCount(search = false) {
    if (!search) {
      this.updateStages(STAGE_FILTER | STAGE_SORT_FILTER);
      return;
    }
    const stage =
      (this._filter.currentSearch ? 0 : STAGE_FILTER | STAGE_SORT_FILTER) |
      STAGE_SEARCH |
      STAGE_SORT_SEARCH;
    this.updateStages(stage);
  }

  private calculateChanges(
    oldFilter: RoomDataFilter,
    newFilter: RoomDataFilter,
  ): () => void {
    if (this._settings === null) {
      return () => '';
    }
    if (Boolean(newFilter.frozenAt) !== Boolean(oldFilter.frozenAt)) {
      return () => this.updateDataSubscription();
    }
    if (
      oldFilter.sourceFilterAcknowledgement !==
        newFilter.sourceFilterAcknowledgement ||
      oldFilter.sourceFilterBrainstorming !==
        newFilter.sourceFilterBrainstorming ||
      oldFilter.ignoreThreshold !== newFilter.ignoreThreshold
    ) {
      return () => this.updateStages(UPDATE_ALL);
    }
    if (
      newFilter.frozenAt !== oldFilter.frozenAt ||
      newFilter.period !== oldFilter.period ||
      newFilter.timeFilterStart !== oldFilter.timeFilterStart
    ) {
      return () =>
        this.updateStages(
          STAGE_PERIOD |
            STAGE_SEARCH |
            STAGE_FILTER |
            STAGE_SORT_SEARCH |
            STAGE_SORT_FILTER,
        );
    }
    if (newFilter.currentSearch !== oldFilter.currentSearch) {
      const stages =
        (newFilter.currentSearch ? 0 : STAGE_FILTER | STAGE_SORT_FILTER) |
        STAGE_SEARCH |
        STAGE_SORT_SEARCH;
      return () => this.updateStages(stages);
    }
    if (
      newFilter.filterType !== oldFilter.filterType ||
      (needFilterCompare.has(newFilter.filterType) &&
        newFilter.filterCompare !== oldFilter.filterCompare)
    ) {
      return () => this.updateStages(STAGE_FILTER | STAGE_SORT_FILTER);
    }
    if (
      newFilter.sortReverse !== oldFilter.sortReverse ||
      newFilter.sortType !== oldFilter.sortType ||
      newFilter.ignoreRoleSort !== oldFilter.ignoreRoleSort
    ) {
      return () => this.updateStages(STAGE_SORT_SEARCH | STAGE_SORT_FILTER);
    }
    return () => '';
  }

  private updateDataSubscription(): void {
    this._dataSubscription?.unsubscribe();
    this._dataSubscription = this.dataAccessFunction(
      Boolean(this._filter.frozenAt),
    ).subscribe((data) => {
      this._tempData = data;
      this.updateStages(UPDATE_ALL);
    });
  }

  private updateStages(stageUpdates: number) {
    if (!this._tempData) {
      return;
    }
    if (stageUpdates & STAGE_PREFILTER) {
      this.preFilterData(this._tempData);
    }
    if (stageUpdates & STAGE_PERIOD) {
      this.buildPeriodCache(this._preFilteredData);
    }
    if (stageUpdates & STAGE_SEARCH) {
      this.buildSearchCache();
    }
    if (stageUpdates & STAGE_SORT_SEARCH) {
      this._sortedSearchData = this.sortData(this._searchData);
      this.emitData(true);
    }
    if (stageUpdates & STAGE_FILTER) {
      this.buildFilterCache();
    }
    if (stageUpdates & STAGE_SORT_FILTER) {
      const comments = this._filterTypeCache[this._filter.filterType];
      if (!comments) {
        this._sortedFilteredData = [];
      } else {
        this._sortedFilteredData = this.sortData(comments);
      }
      this.emitData(false);
    }
  }

  private emitData(searchOnly: boolean) {
    if (searchOnly) {
      if (this._filter.currentSearch) {
        this._currentData.next(this._sortedSearchData);
      }
      return;
    }
    if (this._filter.currentSearch) {
      return;
    }
    const comments = this._filterTypeCache[this._filter.filterType];
    this._currentData.next(
      comments
        ? this._sortedFilteredData
        : this.sortData(this._periodCache[this._filter.period]),
    );
  }

  private preFilterData(data: ForumComment[]) {
    if (this._filter.sourceFilterAcknowledgement !== null) {
      const onlyAck =
        this._filter.sourceFilterAcknowledgement ===
        AcknowledgementFilter.OnlyAcknowledged;
      data = data.filter((c) => c.ack === onlyAck);
    }
    if (this._filter.sourceFilterBrainstorming !== null) {
      const onlyBrain =
        this._filter.sourceFilterBrainstorming ===
        BrainstormingFilter.OnlyBrainstorming;
      data = data.filter(
        (c) => (c.brainstormingSessionId !== null) === onlyBrain,
      );
    }
    if (this._filter.ignoreThreshold) {
      this._preFilteredData = [...data];
      return;
    }
    const threshold = this._settings.threshold;
    this._preFilteredData =
      threshold !== 0 ? data.filter((c) => c.score >= threshold) : [...data];
  }

  private buildPeriodCache(data: ForumComment[]) {
    const frozenAt = this._filter.frozenAt;
    this._filter.timeFilterStart = this._filter.timeFilterStart || Date.now();
    const additional = frozenAt
      ? (c: ForumComment) => new Date(c.createdAt).getTime() <= frozenAt
      : () => true;
    this._periodCache = {} as PeriodCache;
    for (const periodKey of FilteredDataAccess.periodKeys()) {
      const func = periodFunctions[periodKey];
      this._periodCache[periodKey] = data.filter(
        (comment) =>
          func(this._filter.timeFilterStart, comment) && additional(comment),
      );
    }
  }

  private buildSearchCache() {
    const data = this._periodCache[this._filter.period];
    if (!this._filter.currentSearch) {
      this._searchData = [...data];
      return;
    }
    const search = this._filter.currentSearch.toLowerCase();
    const keywordFinder = (e: SpacyKeyword) =>
      e.text.toLowerCase().includes(search);
    this._searchData = data.filter(
      (c) =>
        c.body.toLowerCase().includes(search) ||
        c.keywordsFromSpacy?.some(keywordFinder) ||
        c.keywordsFromQuestioner?.some(keywordFinder) ||
        c.questionerName?.toLowerCase().includes(search),
    );
  }

  private buildFilterCache() {
    const data = this._periodCache[this._filter.period];
    const filterCompare = this._filter.filterCompare;
    this._filterTypeCache = {} as FilterTypeCache;
    for (const key of Object.keys(this.filterFunctions)) {
      const filterKey = key as FilterType;
      if (
        needFilterCompare.has(filterKey) &&
        this._filter.filterType !== filterKey
      ) {
        this._filterTypeCache[filterKey] = [];
        continue;
      }
      const filterFunc = this.filterFunctions[filterKey];
      this._filterTypeCache[filterKey] = data.filter((c) =>
        filterFunc(c, filterCompare),
      );
    }
  }

  private sortData(comments: ForumComment[]): ForumComment[] {
    const factor = this._filter.sortReverse ? -1 : 1;
    const ownerId = this._settings.ownerId;
    const mods = this._settings.moderatorIds;
    const firstStage = this._filter.ignoreRoleSort
      ? () => 0
      : (a, b) =>
          getCommentRoleValue(b, ownerId, mods) -
          getCommentRoleValue(a, ownerId, mods);
    const sortFunc = sortFunctions[this._filter.sortType];
    const secondStage = sortFunc ?? (() => 0);
    return comments.sort((a, b) => {
      const result = firstStage(a, b) * factor;
      if (result !== 0) {
        return result;
      }
      return secondStage(a, b) * factor;
    });
  }
}
