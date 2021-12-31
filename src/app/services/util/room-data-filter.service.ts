import { Injectable } from '@angular/core';
import { RoomDataService } from './room-data.service';
import { SessionService } from './session.service';
import { BehaviorSubject, Observable, of, Subscription } from 'rxjs';
import { DEFAULT_PERIOD, FilterType, Period, RoomDataFilter, SortType } from './room-data-filter';
import { Comment } from '../../models/comment';
import { SpacyKeyword } from '../http/spacy.service';
import { CorrectWrong } from '../../models/correct-wrong.enum';
import { filter, map } from 'rxjs/operators';
import { AuthenticationService } from '../http/authentication.service';

interface FilterResult {
  comments: Comment[];
  timeFilteredCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class RoomDataFilterService {

  private _isModeration = false;
  private _currentFilter = new RoomDataFilter(null);
  private _currentFilteredData = new BehaviorSubject<FilterResult>(null);
  private _dataNotification: Subscription;

  constructor(
    private roomDataService: RoomDataService,
    private sessionService: SessionService,
    private authenticationService: AuthenticationService,
  ) {
    sessionService.getRoom().subscribe(room => {
      if (room) {
        if (this._currentFilter.checkRoom(room.id)) {
          this.refresh();
        }
        roomDataService.receiveUpdates([
          { type: 'CommentCreated', finished: true },
          { type: 'CommentPatched', finished: true },
          { type: 'CommentDeleted', finished: true }
        ]).subscribe(_ => this.refresh());
      }
    });
    this._dataNotification = roomDataService.getRoomData().subscribe(_ => this.refresh());
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

  private static getCommentRoleValue(comment: Comment, ownerId: string, moderatorIds: Set<string>): number {
    if (comment.creatorId === ownerId) {
      return 2;
    } else if (moderatorIds.has(comment.creatorId)) {
      return 1;
    }
    return 0;
  }

  get currentFilter(): RoomDataFilter {
    return new RoomDataFilter(this._currentFilter);
  }

  set currentFilter(filter: RoomDataFilter) {
    this._currentFilter = filter;
    const room = this.sessionService.currentRoom;
    if (room) {
      this._currentFilter.checkRoom(room.id);
    }
    this.refresh();
  }

  get isModeration(): boolean {
    return this._isModeration;
  }

  set isModeration(moderation: boolean) {
    this._isModeration = moderation;
    this._dataNotification?.unsubscribe();
    this.refresh();
    this._dataNotification = this.roomDataService.getRoomData(moderation).subscribe(_ => this.refresh());
  }

  get currentData(): FilterResult {
    return this._currentFilteredData.getValue();
  }

  getData(): Observable<FilterResult> {
    return this._currentFilteredData.asObservable().pipe(filter(v => !!v));
  }

  filterCommentsByFilter(comments: Comment[], filter: RoomDataFilter, isModeration: boolean): Observable<FilterResult> {
    if (!comments) {
      return of(null);
    }
    const threshold = this.sessionService.currentRoom.threshold;
    return this.sessionService.getModeratorsOnce().pipe(
      map((moderators): FilterResult => {
        comments = this.filterTime(comments, filter, threshold, isModeration);
        const timeFilteredCount = comments.length;
        if (filter.currentSearch) {
          return {
            comments: this.filterSearch(comments, filter, threshold, isModeration),
            timeFilteredCount
          };
        }
        const moderatorIds = new Set<string>(moderators.map(m => m.accountId));
        comments = this.filterType(comments, filter, moderatorIds);
        comments = this.sort(comments, filter, moderatorIds);
        return { comments, timeFilteredCount };
      })
    );
  }

  private refresh() {
    this.filterCommentsByFilter(
      this.roomDataService.getCurrentRoomData(this.isModeration),
      this._currentFilter,
      this.isModeration
    ).subscribe(result => this._currentFilteredData.next(result));
  }

  private sort(comments: Comment[], filter: RoomDataFilter, moderatorIds: Set<string>): Comment[] {
    let sortFunc: (a: Comment, b: Comment) => number;
    switch (filter.sortType) {
      case SortType.score:
        sortFunc = (a, b) => b.score - a.score;
        break;
      case SortType.time:
        sortFunc = (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        break;
      case SortType.controversy:
        sortFunc = (a, b) => RoomDataFilterService.calculateControversy(b.upvotes, b.downvotes) -
          RoomDataFilterService.calculateControversy(a.upvotes, a.downvotes);
    }
    if (sortFunc) {
      comments.sort(sortFunc);
    }
    if (filter.sortReverse) {
      comments.reverse();
    }
    const ownerId = this.sessionService.currentRoom.ownerId;
    comments.sort((a, b) => RoomDataFilterService.getCommentRoleValue(b, ownerId, moderatorIds) -
      RoomDataFilterService.getCommentRoleValue(a, ownerId, moderatorIds));
    return comments;
  }

  private filterTime(comments: Comment[], filter: RoomDataFilter, threshold: number, isModeration: boolean): Comment[] {
    const prefiltered = this.prefilter(comments, filter, threshold, isModeration);
    if (filter.period === null || filter.period === undefined) {
      filter.period = DEFAULT_PERIOD;
    }
    if (filter.period === Period.all) {
      return filter.freezedAt ? prefiltered.filter(c => new Date(c.timestamp).getTime() < filter.freezedAt) : prefiltered;
    }
    const currentTime = new Date().getTime();
    let periodInSeconds;
    const hourInSeconds = 3_600_000;
    switch (filter.period) {
      case Period.fromNow:
        if (!filter.fromNow) {
          filter.fromNow = currentTime;
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
    const filterTime = filter.period === Period.fromNow ? filter.fromNow : currentTime - periodInSeconds;
    const freezedAt = filter.freezedAt;
    const func = freezedAt ?
      (time: number) => time >= filterTime && time <= freezedAt :
      (time: number) => time >= filterTime;
    return prefiltered.filter(c => func(new Date(c.timestamp).getTime()));
  }

  private filterSearch(comments: Comment[], filter: RoomDataFilter, threshold: number, isModeration: boolean): Comment[] {
    const search = filter.currentSearch.toLowerCase();
    const keywordFinder = (e: SpacyKeyword) => e.text.toLowerCase().includes(search);
    return this.prefilter(comments, filter, threshold, isModeration).filter(c =>
      c.body.toLowerCase().includes(search) ||
      c.answer?.toLowerCase().includes(search) ||
      c.keywordsFromSpacy?.some(keywordFinder) ||
      c.keywordsFromQuestioner?.some(keywordFinder) ||
      c.questionerName?.toLowerCase().includes(search) ||
      c.answerQuestionerKeywords?.some(keywordFinder) ||
      c.answerFulltextKeywords?.some(keywordFinder));
  }

  private filterType(comments: Comment[], filter: RoomDataFilter, moderators: Set<string>): Comment[] {
    let filterFunc: (c: Comment) => boolean;
    const filterCompare = filter.filterCompare;
    switch (filter.filterType) {
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
        filterFunc = (c) => c.tag === filterCompare;
        break;
      case FilterType.creatorId:
        filterFunc = (c) => c.creatorId === filterCompare;
        break;
      case FilterType.keyword:
        filterFunc = (c) => !!(c.keywordsFromQuestioner?.find(k => k.text === filterCompare) ||
          c.keywordsFromSpacy?.find(k => k.text === filterCompare));
        break;
      case FilterType.answer:
        filterFunc = (c) => !!c.answer;
        break;
      case FilterType.unanswered:
        filterFunc = (c) => !c.answer;
        break;
      case FilterType.owner:
        const userId = this.authenticationService.getUser()?.id;
        filterFunc = (c) => c.creatorId === userId;
        break;
      case FilterType.moderator:
        filterFunc = (c) => moderators.has(c.creatorId);
        break;
      case FilterType.lecturer:
        const ownerId = this.sessionService.currentRoom.ownerId;
        filterFunc = (c) => c.creatorId === ownerId;
        break;
      case FilterType.number:
        filterFunc = (c) => c.number === filterCompare;
        break;
      default:
        return comments;
    }
    return comments.filter(filterFunc);
  }

  private prefilter(comments: Comment[], filter: RoomDataFilter, threshold: number, isModeration: boolean): Comment[] {
    const brainstorm = filter.filterType === FilterType.brainstormingQuestion;
    const brainstorming = isModeration ? comments : comments.filter(c => c.brainstormingQuestion === brainstorm);
    return threshold !== 0 && !isModeration ? brainstorming.filter(c => c.score >= threshold) : brainstorming;
  }
}
