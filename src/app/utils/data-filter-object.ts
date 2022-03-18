import { RoomDataService } from '../services/util/room-data.service';
import { FilterType, FilterTypes, Period, RoomDataFilter, SortType } from './data-filter-object.lib';
import { Comment } from '../models/comment';
import { CorrectWrong } from '../models/correct-wrong.enum';
import { AuthenticationService } from '../services/http/authentication.service';
import { SessionService } from '../services/util/session.service';
import { SpacyKeyword } from '../services/http/spacy.service';
import { BehaviorSubject, Observable, Observer, Subject, Subscription, takeUntil } from 'rxjs';
import { filter } from 'rxjs/operators';

type FilterFunctionObject = {
  [key in FilterType]?: (c: Comment, compareValue?: any) => boolean;
};

type TimeDurationsObject = {
  [key in Period]?: number;
};

type SortFunctionsObject = {
  [key in SortType]?: (a: Comment, b: Comment) => number;
};

interface FilterResult {
  comments: Comment[];
  timeFilteredCount: number;
}

type SubscribeParameterType<T> = Partial<Observer<T>> | ((value: T) => void);

export const calculateControversy = (up = 0, down = 0, normalized = true): number => {
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
};

export const getCommentRoleValue = (comment: Comment, ownerId: string, moderatorIds: Set<string>): number => {
  if (comment.creatorId === ownerId) {
    return 2;
  } else if (moderatorIds.has(comment.creatorId)) {
    return 1;
  }
  return 0;
};

const hourInSeconds = 3_600_000;
const timeDurations: TimeDurationsObject = {
  [Period.OneHour]: hourInSeconds,
  [Period.ThreeHours]: 3 * hourInSeconds,
  [Period.OneDay]: 24 * hourInSeconds,
  [Period.OneWeek]: 24 * 7 * hourInSeconds,
  [Period.TwoWeeks]: 24 * 14 * hourInSeconds,
};
const sortFunctions: SortFunctionsObject = {
  [SortType.Score]: (a, b) => b.score - a.score,
  [SortType.Time]: (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  [SortType.Controversy]: (a, b) =>
    calculateControversy(b.upvotes, b.downvotes) - calculateControversy(a.upvotes, a.downvotes),
};

export class DataFilterObject {

  private _filter: RoomDataFilter;
  private _currentData: Comment[] = null;
  private moderators: Set<string> = null;
  private readonly filterFunctions: FilterFunctionObject = {
    [FilterType.Correct]: c => c.correct === CorrectWrong.CORRECT,
    [FilterType.Wrong]: c => c.correct === CorrectWrong.WRONG,
    [FilterType.Favorite]: c => Boolean(c.favorite),
    [FilterType.Bookmark]: c => Boolean(c.bookmark),
    [FilterType.NotBookmarked]: c => !c.bookmark,
    [FilterType.Read]: c => Boolean(c.read),
    [FilterType.Unread]: c => !c.read,
    [FilterType.Tag]: (c, value) => c.tag === value,
    [FilterType.CreatorId]: (c, value) => c.creatorId === value,
    [FilterType.Keyword]: (c, value) => Boolean(
      c.keywordsFromQuestioner?.find(keyword => keyword.text === value) ||
      c.keywordsFromSpacy?.find(keyword => keyword.text === value)
    ),
    [FilterType.Answer]: c => Boolean(c.meta?.children?.length),
    [FilterType.Unanswered]: c => !c.meta?.children?.length,
    [FilterType.Owner]: c => c.creatorId === this.authenticationService.getUser()?.id,
    [FilterType.Moderator]: c => this.moderators.has(c.creatorId),
    [FilterType.Owner]: c => this.sessionService.currentRoom?.id === c.creatorId,
    [FilterType.Number]: (c, value) => c.number === value,
    [FilterType.Censored]: c => this.roomDataService.checkCommentProfanity(c)
  } as const;
  private readonly _filteredData = new BehaviorSubject<FilterResult>(null);
  private readonly _destroyNotifier = new Subject<any>();

  constructor(
    private readonly filterName: FilterTypes,
    private readonly roomDataService: RoomDataService,
    private readonly authenticationService: AuthenticationService,
    private readonly sessionService: SessionService,
  ) {
    this._filter = RoomDataFilter.loadFilter(filterName);
    this.sessionService.getRoomOnce().pipe(takeUntil(this._destroyNotifier)).subscribe(room => {
      this._filter.checkRoom(room.id);
      this.refreshSourceData();
      this.roomDataService.receiveUpdates([
        { type: 'CommentCreated', finished: true },
        { type: 'CommentPatched', finished: true },
        { type: 'CommentDeleted', finished: true },
      ]).pipe(takeUntil(this._destroyNotifier)).subscribe(() => this.refresh());
    });
    this.sessionService.getModeratorsOnce().pipe(takeUntil(this._destroyNotifier)).subscribe(mods => {
      this.moderators = new Set([...mods.map(mod => mod.accountId)]);
      this.refresh();
    });
  }

  get currentData(): FilterResult {
    return this._filteredData.getValue();
  }

  get filter(): RoomDataFilter {
    return new RoomDataFilter(this._filter);
  }

  set filter(dataFilter: RoomDataFilter) {
    const previous = this._filter;
    this._filter = dataFilter;
    this.refresh(previous);
  }

  static filterOnce(
    dataFilter: RoomDataFilter, data: RoomDataService, auth: AuthenticationService, session: SessionService
  ): Observable<FilterResult> {
    const filterObject = new DataFilterObject('dummy' as unknown as FilterTypes, data, auth, session);
    filterObject.filter = dataFilter;
    const unload = () => {
      filterObject.unload();
      sessionStorage.removeItem('dummy');
    };
    return new Observable<FilterResult>(subscriber => {
      filterObject.subscribe(result => {
        subscriber.next(result);
        subscriber.complete();
        unload();
      });
      return () => unload();
    });
  }

  subscribe(observer: SubscribeParameterType<FilterResult>): Subscription {
    if (!this._filteredData.observed) {
      this.refresh(undefined, true);
    }
    // @ts-ignore
    return this._filteredData.pipe(filter(v => !!v)).subscribe(observer);
  }

  unload() {
    if (this._filteredData.closed) {
      return;
    }
    this._filteredData.complete();
    this._destroyNotifier.next(true);
    this._destroyNotifier.complete();
    this._filter.save(this.filterName);
  }

  private refreshSourceData() {
    const frozenAt = this._filter.freezedAt;
    const frozen = Boolean(frozenAt);
    this.roomDataService.getRoomDataOnce(frozen, Boolean(this._filter.moderation))
      .pipe(takeUntil(this._destroyNotifier)).subscribe(data => {
      const previous = this._currentData;
      this._currentData = frozen ? data.filter(c => new Date(c.createdAt).getTime() <= frozenAt) : data;
      if (!previous && this.moderators && this._filteredData.observed) {
        this.refresh();
      }
    });
  }

  private refresh(previousFilter?: RoomDataFilter, ignoreObserved = false) {
    const observed = this._filteredData.observed || ignoreObserved;
    if (!this._currentData || !this.moderators || !observed) {
      return;
    }
    if (previousFilter && (Boolean(previousFilter.freezedAt) !== Boolean(this._filter.freezedAt) ||
      Boolean(previousFilter.moderation) !== Boolean(this._filter.moderation))) {
      this.refreshSourceData();
    }
    const room = this.sessionService.currentRoom;
    // filter for brainstorming and threshold
    const threshold = room.threshold;
    const isBrainstormingActive = this._filter.filterType === FilterType.BrainstormingQuestion;
    let comments = this._currentData.filter(c => c.brainstormingQuestion === isBrainstormingActive);
    comments = threshold !== 0 && !this._filter.moderation ? comments.filter(c => c.score >= threshold) : comments;
    // filter time
    comments = this.filterWithTime(comments);
    const timeFilteredCount = comments.length;
    // filter search
    if (this._filter.currentSearch) {
      this._filteredData.next({
        timeFilteredCount,
        comments: this.filterWithSearch(comments),
      });
      return;
    }
    // filter with types
    const filterCompare = this._filter.filterCompare;
    const filterFunc = this.filterFunctions[this._filter.filterType];
    if (filterFunc) {
      comments = comments.filter(c => filterFunc(c, filterCompare));
    }
    // sort comments
    const sortFunc = sortFunctions[this._filter.sortType];
    if (sortFunc) {
      comments.sort(sortFunc);
    }
    if (!this._filter.ignoreRoleSort) {
      comments.sort((a, b) => getCommentRoleValue(b, room.ownerId, this.moderators) -
        getCommentRoleValue(a, room.ownerId, this.moderators));
    }
    if (this._filter.sortReverse) {
      comments.reverse();
    }
    this._filteredData.next({ timeFilteredCount, comments });
  }

  private filterWithSearch(comments: Comment[]) {
    const search = this._filter.currentSearch.toLowerCase();
    const keywordFinder = (e: SpacyKeyword) => e.text.toLowerCase().includes(search);
    return comments.filter(c =>
      c.body.toLowerCase().includes(search) ||
      c.keywordsFromSpacy?.some(keywordFinder) ||
      c.keywordsFromQuestioner?.some(keywordFinder) ||
      c.questionerName?.toLowerCase().includes(search));
  }

  private filterWithTime(comments: Comment[]) {
    const currentTime = new Date().getTime();
    const duration = timeDurations[this._filter.period];
    if (duration) {
      const filterTime = currentTime - duration;
      return comments.filter(c => new Date(c.createdAt).getTime() >= filterTime);
    } else if (this._filter.period === Period.FromNow) {
      if (!this._filter.fromNow) {
        this._filter.fromNow = currentTime;
      }
      const filterTime = this._filter.fromNow;
      return comments.filter(c => new Date(c.createdAt).getTime() >= filterTime);
    }
    return comments;
  }

}
