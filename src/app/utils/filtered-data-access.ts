import {
  AcknowledgementFilter,
  BrainstormingFilter,
  FilterType,
  FilterTypes,
  Period,
  RoomDataFilter,
  SortType,
} from './data-filter-object.lib';
import {
  BehaviorSubject,
  Observable,
  of,
  Subject,
  Subscription,
  takeUntil,
} from 'rxjs';
import { SpacyKeyword } from '../services/http/spacy.service';
import { CorrectWrong } from '../models/correct-wrong.enum';
import { Comment } from '../models/comment';
import { SessionService } from '../services/util/session.service';
import { Room } from '../models/room';
import { filter, map, take } from 'rxjs/operators';
import {
  afterUpdate,
  afterUpdateModerated,
  CommentUpdate,
  UIComment,
  uiComments,
  uiModeratedComments,
} from 'app/room/state/comment-updates';
import { EventEmitter, Injector } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';

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
type PeriodCache = { [key in Period]: UIComment[] };
export type PeriodCounts = { [key in Period]: number };
type PeriodFunctions = {
  [key in Period]: (currentTime: number, comment: UIComment) => boolean;
};
const hourInSeconds = 3_600_000;
const threeHoursInSeconds = 3 * hourInSeconds;
const oneDayInSeconds = 24 * hourInSeconds;
const oneWeekInSeconds = 7 * oneDayInSeconds;
const twoWeekInSeconds = 2 * oneWeekInSeconds;
const periodFunctions: PeriodFunctions = {
  [Period.FromNow]: (time, c) =>
    new Date(c.comment.createdAt).getTime() >= time,
  [Period.OneHour]: (time, c) =>
    new Date(c.comment.createdAt).getTime() >= time - hourInSeconds,
  [Period.ThreeHours]: (time, c) =>
    new Date(c.comment.createdAt).getTime() >= time - threeHoursInSeconds,
  [Period.OneDay]: (time, c) =>
    new Date(c.comment.createdAt).getTime() >= time - oneDayInSeconds,
  [Period.OneWeek]: (time, c) =>
    new Date(c.comment.createdAt).getTime() >= time - oneWeekInSeconds,
  [Period.TwoWeeks]: (time, c) =>
    new Date(c.comment.createdAt).getTime() >= time - twoWeekInSeconds,
  [Period.All]: () => true,
};

// Filter definitions
type FilterTypeCache = { [key in FilterType]: UIComment[] };
export type FilterTypeCounts = { [key in FilterType]: number };
type FilterFunction = (c: UIComment, compareValue?: unknown) => boolean;
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
  [key in SortType]?: (a: UIComment, b: UIComment) => number;
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
  [SortType.Score]: (a, b) => b.comment.score - a.comment.score,
  [SortType.Time]: (a, b) =>
    new Date(b.comment.createdAt).getTime() -
    new Date(a.comment.createdAt).getTime(),
  [SortType.Controversy]: (a, b) =>
    calculateControversy(
      b.comment.upvotes,
      b.comment.downvotes,
      b.totalAnswerCount.participants +
        b.totalAnswerCount.moderators +
        b.totalAnswerCount.creator,
    ) -
    calculateControversy(
      a.comment.upvotes,
      a.comment.downvotes,
      a.totalAnswerCount.participants +
        a.totalAnswerCount.moderators +
        a.totalAnswerCount.creator,
    ),
  [SortType.Commented]: (a, b) =>
    b.totalAnswerCount.participants +
    b.totalAnswerCount.moderators +
    b.totalAnswerCount.creator -
    a.totalAnswerCount.participants +
    a.totalAnswerCount.moderators +
    a.totalAnswerCount.creator,
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
  parentComment: UIComment,
  func: FilterFunction,
  compareValue?: unknown,
): [level: number, parent: UIComment] => {
  const getHighestElement = (
    comment: UIComment,
    i = 1,
  ): [level: number, parent: UIComment] => {
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
    c.comment.keywordsFromQuestioner?.find(
      (keyword) => keyword.text === value,
    ) || c.comment.keywordsFromSpacy?.find((keyword) => keyword.text === value),
  );

export class FilteredDataAccess {
  private readonly filterFunctions: FilterFunctionObject = {
    [FilterType.Correct]: (c) => c.comment.correct === CorrectWrong.CORRECT,
    [FilterType.Wrong]: (c) => c.comment.correct === CorrectWrong.WRONG,
    [FilterType.Favorite]: (c) => Boolean(c.comment.favorite),
    [FilterType.Bookmark]: (c) => Boolean(c.comment.bookmark),
    [FilterType.NotBookmarked]: (c) => !c.comment.bookmark,
    [FilterType.Read]: (c) => Boolean(c.comment.read),
    [FilterType.Unread]: (c) => !c.comment.read,
    [FilterType.Tag]: (c, value) => c.comment.tag === value,
    [FilterType.CreatorId]: (c, value) => c.comment.creatorId === value,
    [FilterType.Keyword]: (c, value) =>
      hasKeyword(c, value) ||
      (!this._isRaw
        ? getMultiLevelFilterParent(c, hasKeyword, value) !== null
        : false),
    [FilterType.AnsweredCreator]: (c) => c.totalAnswerCount.creator > 0,
    [FilterType.AnsweredModerator]: (c) => c.totalAnswerCount.moderators > 0,
    [FilterType.Unanswered]: (c) =>
      c.totalAnswerCount.creator < 1 && c.totalAnswerCount.moderators < 1,
    [FilterType.Owner]: (c) => c.comment.creatorId === this._settings.userId,
    [FilterType.Moderator]: (c) =>
      this._settings.moderatorIds.has(c.comment.creatorId) ||
      c.comment.creatorId === this._settings.ownerId,
    [FilterType.Number]: (c, value) => c.comment.number === value,
    [FilterType.Censored]: (c) => this._profanityChecker(c),
    [FilterType.Conversation]: (c) =>
      c.totalAnswerCount.participants +
        c.totalAnswerCount.moderators +
        c.totalAnswerCount.creator >
      0,
    [FilterType.BrainstormingIdea]: (c, value) =>
      Array.isArray(value) && value?.includes?.(c.comment.brainstormingWordId),
    [FilterType.Approved]: (c) =>
      c.comment.approved ||
      (!this._isRaw
        ? getMultiLevelFilterParent(
            c,
            (comment) => comment.comment.approved,
          ) !== null
        : false),
    [FilterType.ChatGPT]: (c) =>
      c.comment.gptWriterState > 0 ||
      (!this._isRaw
        ? getMultiLevelFilterParent(
            c,
            (comment) => comment.comment.gptWriterState > 0,
          ) !== null
        : false),
  } as const;
  // general properties
  private _settings: AttachOptions = null;
  private _destroyNotifier: Subject<unknown>;
  private _dataSubscription: Subscription;
  // stage caches
  private _tempData: UIComment[];
  private _preFilteredData: UIComment[];
  private _periodCache: PeriodCache;
  private _searchData: UIComment[];
  private _sortedSearchData: UIComment[];
  private _filterTypeCache: FilterTypeCache;
  private _sortedFilteredData: UIComment[];
  // current data
  private _currentData: BehaviorSubject<Readonly<UIComment[]>>;

  private constructor(
    public readonly dataAccessFunction: (
      frozen: boolean,
    ) => Observable<UIComment[]>,
    private _isRaw: boolean,
    private _filter: RoomDataFilter,
    private _profanityChecker: (comment: UIComment) => boolean,
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
    commentId: string,
  ): FilteredDataAccess {
    let dataAccessor = uiComments;
    let data = dataAccessor().fastAccess[commentId];
    let after = afterUpdate;
    if (data === null) {
      dataAccessor = uiModeratedComments;
      data = dataAccessor().fastAccess[commentId];
      after = afterUpdateModerated;
    }
    if (data == null) {
      return null;
    }
    const access = new FilteredDataAccess(
      () => of([...data.comment.children]),
      false,
      RoomDataFilter.loadFilter('children'),
      () => false,
      (destroyer) => {
        this.constructAttachment(destroyer, sessionService, after, access);
        this.constructChildrenAttachment(
          destroyer,
          after,
          data.comment,
          access,
        );
      },
    );
    return access;
  }

  static buildModeratedAccess(
    sessionService: SessionService,
    injector: Injector,
    raw: boolean,
    name: FilterTypes,
  ): FilteredDataAccess {
    const access = new FilteredDataAccess(
      raw
        ? (frozen) => {
            return toObservable(uiModeratedComments, {
              injector: injector,
            }).pipe(
              filter(Boolean),
              take(frozen ? 1 : Number.MAX_SAFE_INTEGER),
              map((e) => e.rawComments),
            );
          }
        : (frozen) => {
            return toObservable(uiModeratedComments, {
              injector: injector,
            }).pipe(
              filter(Boolean),
              take(frozen ? 1 : Number.MAX_SAFE_INTEGER),
              map((e) => e.forumComments),
            );
          },
      raw,
      RoomDataFilter.loadFilter(name),
      () => false,
      (destroyer) =>
        this.constructAttachment(
          destroyer,
          sessionService,
          afterUpdateModerated,
          access,
        ),
    );
    return access;
  }

  static buildNormalAccess(
    sessionService: SessionService,
    injector: Injector,
    raw: boolean,
    name: FilterTypes,
    forceOptions?: Partial<RoomDataFilter>,
  ): FilteredDataAccess {
    const roomDataFilter = RoomDataFilter.loadFilter(name);
    if (forceOptions) {
      roomDataFilter.applyOptions(forceOptions);
    }
    const access = new FilteredDataAccess(
      raw
        ? (frozen) => {
            return toObservable(uiComments, {
              injector: injector,
            }).pipe(
              filter(Boolean),
              take(frozen ? 1 : Number.MAX_SAFE_INTEGER),
              map((e) => e.rawComments),
            );
          }
        : (frozen) => {
            return toObservable(uiComments, {
              injector: injector,
            }).pipe(
              filter(Boolean),
              take(frozen ? 1 : Number.MAX_SAFE_INTEGER),
              map((e) => e.forumComments),
            );
          },
      raw,
      roomDataFilter,
      () => false,
      (destroyer) =>
        this.constructAttachment(
          destroyer,
          sessionService,
          afterUpdate,
          access,
        ),
    );
    return access;
  }

  private static constructChildrenAttachment(
    destroyer: Subject<unknown>,
    afterUpdate: EventEmitter<CommentUpdate>,
    comment: UIComment,
    access: FilteredDataAccess,
  ) {
    afterUpdate
      .pipe(
        filter(
          (e) => e.type === 'CommentCreated' || e.type === 'CommentDeleted',
        ),
        takeUntil(destroyer),
      )
      .subscribe((info) => {
        const found = Array.from(comment.children.values()).find(
          (e) => e.comment.id === info.comment.id,
        );
        if (!found) return;
        access.updateDataSubscription();
      });
  }

  private static constructAttachment(
    destroyer: Subject<unknown>,
    sessionService: SessionService,
    afterUpdate: EventEmitter<CommentUpdate>,
    access: FilteredDataAccess,
  ) {
    afterUpdate
      .pipe(
        filter((e) => e.type === 'CommentPatched'),
        takeUntil(destroyer),
      )
      .subscribe((info) => {
        if (info.type === 'CommentPatched') {
          const filterType = access._filter.filterType;
          if (
            access._tempData.find((e) => e.comment.id === info.id) !==
              undefined &&
            this.hasChanges(
              filterType,
              Object.keys(info.changes) as (keyof Comment)[],
            )
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

  getFilteredData(): Observable<Readonly<UIComment[]>> {
    if (this._settings == null) {
      throw new Error('FilteredDataAccess not initialized!');
    }
    return this._currentData.pipe(filter((v) => Boolean(v)));
  }

  getCurrentData(): Readonly<UIComment[]> {
    return this._currentData.value;
  }

  getSourceData(): Readonly<UIComment[]> {
    return this._tempData || [];
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

  private preFilterData(data: UIComment[]) {
    if (this._filter.sourceFilterAcknowledgement !== null) {
      const onlyAck =
        this._filter.sourceFilterAcknowledgement ===
        AcknowledgementFilter.OnlyAcknowledged;
      data = data.filter((c) => c.comment.ack === onlyAck);
    }
    if (this._filter.sourceFilterBrainstorming !== null) {
      const onlyBrain =
        this._filter.sourceFilterBrainstorming ===
        BrainstormingFilter.OnlyBrainstorming;
      data = data.filter(
        (c) => (c.comment.brainstormingSessionId !== null) === onlyBrain,
      );
    }
    if (this._filter.ignoreThreshold) {
      this._preFilteredData = [...data];
      return;
    }
    const threshold = this._settings.threshold;
    this._preFilteredData =
      threshold !== 0
        ? data.filter((c) => c.comment.score >= threshold)
        : [...data];
  }

  private buildPeriodCache(data: UIComment[]) {
    const frozenAt = this._filter.frozenAt;
    this._filter.timeFilterStart = this._filter.timeFilterStart || Date.now();
    const additional = frozenAt
      ? (c: UIComment) => new Date(c.comment.createdAt).getTime() <= frozenAt
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
        c.comment.body.toLowerCase().includes(search) ||
        c.comment.keywordsFromSpacy?.some(keywordFinder) ||
        c.comment.keywordsFromQuestioner?.some(keywordFinder) ||
        c.comment.questionerName?.toLowerCase().includes(search),
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

  private sortData(comments: UIComment[]): UIComment[] {
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
