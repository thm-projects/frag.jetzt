import { Injectable } from '@angular/core';
import { TopicCloudAdminData } from '../../components/shared/_dialogs/topic-cloud-administration/TopicCloudAdminData';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { TopicCloudAdminService } from './topic-cloud-admin.service';
import { Comment } from '../../models/comment';
import { RoomDataService } from './room-data.service';
import { CloudParameters } from '../../utils/cloud-parameters';
import { SmartDebounce } from '../../utils/smart-debounce';
import { Room } from '../../models/room';
import { SessionService } from './session.service';
import { TagCloudDataBuilder } from './tag-cloud-data.util';
import {
  calculateControversy,
  FilteredDataAccess,
} from '../../utils/filtered-data-access';
import { ForumComment } from '../../utils/data-accessor';
import { RoomService } from '../http/room.service';

export interface TagCloudDataTagEntry {
  weight: number;
  adjustedWeight: number;
  cachedVoteCount: number;
  cachedUpVotes: number;
  cachedDownVotes: number;
  distinctUsers: Set<string>;
  firstTimeStamp: Date;
  lastTimeStamp: Date;
  categories: Set<string>;
  dependencies: Set<string>;
  comments: Comment[];
  generatedByQuestionerCount: number;
  taggedCommentsCount: number;
  commentsByCreator: number;
  commentsByModerators: number;
  responseCount: number;
  answerCount: number;
  countedComments: Set<string>;
  questionChildren: Map<string, ForumComment[]>;
}

export interface TagCloudMetaData {
  commentCount: number;
  userCount: number;
  tagCount: number;
  minWeight: number;
  maxWeight: number;
  countPerWeight: TagCloudMetaDataCount;
}

/**
 * The key is a generated tag (out of all comments).
 */
export type TagCloudData = Map<string, TagCloudDataTagEntry>;

export type TagCloudMetaDataCount = [
  number, // w1
  number, // w2
  number, // w3
  number, // w4
  number, // w5
  number, // w6
  number, // w7
  number, // w8
  number, // w9
  number, // w10
];

@Injectable({
  providedIn: 'root',
})
export class TagCloudDataService {
  private _isAlphabeticallySorted: boolean;
  private _dataBus: BehaviorSubject<TagCloudData>;
  private _metaDataBus: BehaviorSubject<TagCloudMetaData>;
  private _commentSubscription = null;
  private _lastFetchedData: TagCloudData = null;
  private _lastMetaData: TagCloudMetaData = null;
  private readonly _currentMetaData: TagCloudMetaData;
  private _adminData: TopicCloudAdminData = null;
  private _subscriptionAdminData: Subscription;
  private readonly _smartDebounce = new SmartDebounce(200, 3_000);
  private _lastSubscription: Subscription;
  private _filterObject: FilteredDataAccess;

  constructor(
    private _tagCloudAdmin: TopicCloudAdminService,
    private _roomDataService: RoomDataService,
    private _roomService: RoomService,
    private sessionService: SessionService,
  ) {
    this._isAlphabeticallySorted = false;
    this._dataBus = new BehaviorSubject<TagCloudData>(null);
    this._currentMetaData = {
      tagCount: 0,
      commentCount: 0,
      userCount: 0,
      minWeight: 0,
      maxWeight: 0,
      countPerWeight: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    };
    this._metaDataBus = new BehaviorSubject<TagCloudMetaData>(null);
    this.sessionService.getRoom().subscribe((room) => this.onRoomUpdate(room));
  }

  get metaData(): TagCloudMetaData {
    return this._currentMetaData;
  }

  get currentData(): TagCloudData {
    return this._dataBus.value;
  }

  get alphabeticallySorted(): boolean {
    return this._isAlphabeticallySorted;
  }

  set filterObject(filter: FilteredDataAccess) {
    this._filterObject = filter;
    this._lastSubscription?.unsubscribe();
    this._lastSubscription = filter
      ?.getFilteredData()
      ?.subscribe(() => this.rebuildTagData());
  }

  static buildDataFromComments(
    roomOwner: string,
    moderators: Set<string>,
    blacklist: string[],
    blacklistEnabled: boolean,
    adminData: TopicCloudAdminData,
    roomDataService: RoomDataService,
    comments: Comment[],
  ): [TagCloudData, Set<string>] {
    const builder = new TagCloudDataBuilder(
      moderators,
      roomDataService,
      adminData,
      blacklist,
      blacklistEnabled,
      roomOwner,
    );
    builder.addComments(comments as ForumComment[]);
    return [builder.getData(), builder.getUsers()];
  }

  unloadCloud() {
    this._filterObject?.detach(true);
  }

  blockWord(tag: string, room: Room): void {
    this._tagCloudAdmin.addWordToBlacklist(tag.toLowerCase(), room);
  }

  updateConfig(parameters: CloudParameters): boolean {
    if (parameters.sortAlphabetically !== this._isAlphabeticallySorted) {
      this._isAlphabeticallySorted = parameters.sortAlphabetically;
      this.reformatData();
      return true;
    }
    return false;
  }

  getData(): Observable<TagCloudData> {
    return this._dataBus.asObservable();
  }

  getMetaData(): Observable<TagCloudMetaData> {
    return this._metaDataBus.asObservable();
  }

  reformatData(): void {
    const current = this.getCurrentData();
    if (!current) {
      console.error('Got no data for tag cloud!');
      return;
    }
    let newData: TagCloudData;
    if (this._isAlphabeticallySorted) {
      newData = new Map<string, TagCloudDataTagEntry>(
        [...current].sort(([aTag], [bTag]) =>
          aTag.localeCompare(bTag, undefined, { sensitivity: 'base' }),
        ),
      );
    } else {
      newData = new Map<string, TagCloudDataTagEntry>(
        [...current].sort(
          ([, aTagData], [, bTagData]) => bTagData.weight - aTagData.weight,
        ),
      );
    }
    this._smartDebounce.call(() => this._dataBus.next(newData));
  }

  private onRoomUpdate(room: Room) {
    this._subscriptionAdminData?.unsubscribe();
    this._subscriptionAdminData = null;
    this._commentSubscription?.unsubscribe();
    this._commentSubscription = null;
    if (!room) {
      return;
    }
    this.sessionService.receiveRoomUpdates().subscribe(() => {
      this.rebuildTagData();
    });
    this._subscriptionAdminData = this._tagCloudAdmin.getAdminData.subscribe(
      (adminData) => {
        this.onReceiveAdminData(adminData, true);
      },
    );
    this._commentSubscription = this._roomDataService.dataAccessor
      .receiveUpdates([
        { type: 'CommentCreated', finished: true },
        { type: 'CommentDeleted' },
        { type: 'CommentPatched', finished: true, updates: ['score'] },
        { type: 'CommentPatched', finished: true, updates: ['downvotes'] },
        { type: 'CommentPatched', finished: true, updates: ['upvotes'] },
        {
          type: 'CommentPatched',
          finished: true,
          updates: ['keywordsFromSpacy'],
        },
        {
          type: 'CommentPatched',
          finished: true,
          updates: ['keywordsFromQuestioner'],
        },
        { type: 'CommentPatched', finished: true, updates: ['ack'] },
        { type: 'CommentPatched', finished: true, updates: ['tag'] },
      ])
      .subscribe(() => {
        this.rebuildTagData();
      });
  }

  private onReceiveAdminData(data: TopicCloudAdminData, update = false) {
    this._adminData = data;
    if (update) {
      this.sessionService
        .getModeratorsOnce()
        .subscribe(() => this.rebuildTagData());
    }
  }

  private getCurrentData(): TagCloudData {
    return this._lastFetchedData;
  }

  private calculateWeight(tagData: TagCloudDataTagEntry): number {
    const scorings = this._adminData.scorings;
    return (
      tagData.comments.length * scorings.countComments.score +
      tagData.distinctUsers.size * scorings.countUsers.score +
      tagData.generatedByQuestionerCount *
        scorings.countSelectedByQuestioner.score +
      tagData.commentsByModerators * scorings.countKeywordByModerator.score +
      tagData.commentsByCreator * scorings.countKeywordByCreator.score +
      tagData.cachedUpVotes * scorings.summedUpvotes.score +
      tagData.cachedDownVotes * scorings.summedDownvotes.score +
      tagData.cachedVoteCount * scorings.summedVotes.score +
      tagData.answerCount * scorings.answerCount.score +
      (tagData.responseCount - tagData.answerCount) *
        scorings.responseCount.score +
      calculateControversy(
        tagData.cachedUpVotes,
        tagData.cachedDownVotes,
        tagData.responseCount,
      ) *
        scorings.controversy.score +
      Math.max(tagData.cachedVoteCount, 0) * scorings.cappedSummedVotes.score
    );
  }

  private rebuildTagData() {
    if (!this._filterObject || this._filterObject.dataFilter.ignoreThreshold) {
      // ignoreThreshold = moderation
      return;
    }
    const filteredComments = this._filterObject.getCurrentData();
    if (!filteredComments) {
      return;
    }
    const currentMeta = this._currentMetaData;
    currentMeta.commentCount = filteredComments.length;
    const room = this.sessionService.currentRoom;
    const currentBlacklist = room.blacklist ? JSON.parse(room.blacklist) : [];
    const [data, users] = TagCloudDataService.buildDataFromComments(
      room.ownerId,
      new Set<string>(
        this.sessionService.currentModerators.map((m) => m.accountId),
      ),
      currentBlacklist,
      room.blacklistActive,
      this._adminData,
      this._roomDataService,
      [...filteredComments],
    );
    let minWeight = null;
    let maxWeight = null;
    data.forEach((value) => {
      value.weight = this.calculateWeight(value);
      minWeight = Math.min(
        value.weight,
        minWeight === null ? value.weight : minWeight,
      );
      maxWeight = Math.max(
        value.weight,
        maxWeight === null ? value.weight : maxWeight,
      );
    });
    //calculate weight counts and adjusted weights
    const same = minWeight === maxWeight;
    const span = maxWeight - minWeight;
    currentMeta.countPerWeight = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (const value of data.values()) {
      value.adjustedWeight = same
        ? 4
        : Math.round(((value.weight - minWeight) * 9.0) / span);
      ++currentMeta.countPerWeight[value.adjustedWeight];
    }
    this._lastFetchedData = data;
    currentMeta.tagCount = data.size;
    currentMeta.userCount = users.size;
    currentMeta.minWeight = minWeight;
    currentMeta.maxWeight = maxWeight;
    this._metaDataBus.next(currentMeta);
    this.reformatData();
  }
}
