import { Injectable } from '@angular/core';
import { TopicCloudAdminData } from '../../components/shared/_dialogs/topic-cloud-administration/TopicCloudAdminData';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { TopicCloudAdminService } from './topic-cloud-admin.service';
import { TranslateService } from '@ngx-translate/core';
import { Comment } from '../../models/comment';
import { RoomDataService } from './room-data.service';
import { SpacyKeyword } from '../http/spacy.service';
import { CloudParameters } from '../../utils/cloud-parameters';
import { SmartDebounce } from '../../utils/smart-debounce';
import { Room } from '../../models/room';
import { SessionService } from './session.service';
import { FilterType } from '../../utils/data-filter-object.lib';
import { calculateControversy, DataFilterObject } from '../../utils/data-filter-object';

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
  number  // w10
];

@Injectable({
  providedIn: 'root'
})
export class TagCloudDataService {
  private _isDemoActive: boolean;
  private _isAlphabeticallySorted: boolean;
  private _dataBus: BehaviorSubject<TagCloudData>;
  private _metaDataBus: BehaviorSubject<TagCloudMetaData>;
  private _commentSubscription = null;
  private _lastFetchedData: TagCloudData = null;
  private _lastMetaData: TagCloudMetaData = null;
  private readonly _currentMetaData: TagCloudMetaData;
  private _demoData: TagCloudData = null;
  private _adminData: TopicCloudAdminData = null;
  private _subscriptionAdminData: Subscription;
  private readonly _smartDebounce = new SmartDebounce(200, 3_000);
  private _lastSubscription: Subscription;
  private _filterObject: DataFilterObject;

  constructor(
    private _tagCloudAdmin: TopicCloudAdminService,
    private _roomDataService: RoomDataService,
    private sessionService: SessionService,
  ) {
    this._isDemoActive = false;
    this._isAlphabeticallySorted = false;
    this._dataBus = new BehaviorSubject<TagCloudData>(null);
    this._currentMetaData = {
      tagCount: 0,
      commentCount: 0,
      userCount: 0,
      minWeight: 0,
      maxWeight: 0,
      countPerWeight: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    };
    this._metaDataBus = new BehaviorSubject<TagCloudMetaData>(null);
    this.sessionService.getRoom().subscribe(room => this.onRoomUpdate(room));
  }

  get metaData(): TagCloudMetaData {
    return this._currentMetaData;
  }

  get currentData(): TagCloudData {
    return this._dataBus.value;
  }

  get isBrainstorming(): boolean {
    return this._filterObject?.filter?.filterType === FilterType.BrainstormingQuestion;
  }

  get alphabeticallySorted(): boolean {
    return this._isAlphabeticallySorted;
  }

  get demoActive(): boolean {
    return this._isDemoActive;
  }

  set demoActive(active: boolean) {
    if (active !== this._isDemoActive) {
      this._isDemoActive = active;
      if (this._isDemoActive) {
        this._lastMetaData = {
          ...this._currentMetaData,
          countPerWeight: [...this._currentMetaData.countPerWeight]
        };
        this._currentMetaData.minWeight = 1;
        this._currentMetaData.maxWeight = 10;
        this._currentMetaData.countPerWeight = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
      } else if (this._lastMetaData !== null) {
        for (const key of Object.keys(this._lastMetaData)) {
          this._currentMetaData[key] = this._lastMetaData[key];
        }
        this._lastMetaData = null;
      }
      this.reformatData();
    }
  }

  set filterObject(filter: DataFilterObject) {
    this._filterObject = filter;
    this._lastSubscription?.unsubscribe();
    this._lastSubscription = filter?.subscribe(() => this.rebuildTagData());
  }

  static buildDataFromComments(roomOwner: string,
                               moderators: Set<string>,
                               blacklist: string[],
                               blacklistEnabled: boolean,
                               adminData: TopicCloudAdminData,
                               roomDataService: RoomDataService,
                               comments: Comment[],
                               brainstorming: boolean): [TagCloudData, Set<string>] {
    const data: TagCloudData = new Map<string, TagCloudDataTagEntry>();
    const users = new Set<string>();
    for (const comment of comments) {
      if (brainstorming !== comment.brainstormingQuestion) {
        continue;
      }
      TopicCloudAdminService.approveKeywordsOfComment(comment, roomDataService, adminData, blacklist, blacklistEnabled,
        brainstorming, (keyword: SpacyKeyword, isFromQuestioner: boolean) => {
          this.onKeywordApproved(comment, data, keyword, isFromQuestioner, roomOwner, moderators);
        });
      users.add(comment.creatorId);
    }
    return [
      new Map<string, TagCloudDataTagEntry>([...data].filter(v => brainstorming ||
        TopicCloudAdminService.isTopicAllowed(adminData, v[1].comments.length, v[1].distinctUsers.size,
          v[1].cachedUpVotes, v[1].firstTimeStamp, v[1].lastTimeStamp))),
      users
    ];
  }

  private static onKeywordApproved(
    comment: Comment, data: TagCloudData, keyword: SpacyKeyword, isFromQuestioner: boolean, roomOwner: string,
    moderators: Set<string>
  ) {
    let current: TagCloudDataTagEntry = data.get(keyword.text);
    const commentDate = new Date(comment.createdAt);
    if (current === undefined) {
      current = {
        cachedVoteCount: 0,
        cachedUpVotes: 0,
        cachedDownVotes: 0,
        comments: [],
        weight: 0,
        adjustedWeight: 0,
        distinctUsers: new Set<string>(),
        categories: new Set<string>(),
        dependencies: new Set<string>([...keyword.dep]),
        firstTimeStamp: commentDate,
        lastTimeStamp: commentDate,
        generatedByQuestionerCount: 0,
        taggedCommentsCount: 0,
        commentsByCreator: 0,
        commentsByModerators: 0
      };
      data.set(keyword.text, current);
    }
    keyword.dep.forEach(dependency => current.dependencies.add(dependency));
    current.cachedVoteCount += comment.score;
    current.cachedUpVotes += comment.upvotes;
    current.cachedDownVotes += comment.downvotes;
    current.distinctUsers.add(comment.creatorId);
    current.generatedByQuestionerCount += +isFromQuestioner;
    current.taggedCommentsCount += +!!comment.tag;
    if (comment.creatorId === roomOwner) {
      ++current.commentsByCreator;
    } else if (moderators.has(comment.creatorId)) {
      ++current.commentsByModerators;
    }
    if (comment.tag) {
      current.categories.add(comment.tag);
    }
    // @ts-ignore
    if (current.firstTimeStamp - commentDate > 0) {
      current.firstTimeStamp = commentDate;
    }
    // @ts-ignore
    if (current.lastTimeStamp - commentDate < 0) {
      current.lastTimeStamp = commentDate;
    }
    current.comments.push(comment);
  }

  updateDemoData(translate: TranslateService): void {
    translate.get('tag-cloud.demo-data-topic').subscribe(text => {
      this._demoData = new Map<string, TagCloudDataTagEntry>();
      for (let i = 10; i >= 1; i--) {
        this._demoData.set(text.replace('%d', '' + i), {
          cachedVoteCount: 0,
          cachedUpVotes: 0,
          cachedDownVotes: 0,
          comments: [],
          weight: i,
          adjustedWeight: i - 1,
          categories: new Set<string>(),
          distinctUsers: new Set<string>(),
          dependencies: new Set<string>(),
          firstTimeStamp: new Date(),
          lastTimeStamp: new Date(),
          generatedByQuestionerCount: 0,
          taggedCommentsCount: 0,
          commentsByCreator: 0,
          commentsByModerators: 0
        });
      }
    });
  }

  unloadCloud() {
    this._filterObject?.unload();
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
      newData = new Map<string, TagCloudDataTagEntry>([...current]
        .sort(([aTag], [bTag]) => aTag.localeCompare(bTag, undefined, { sensitivity: 'base' })));
    } else {
      newData = new Map<string, TagCloudDataTagEntry>([...current]
        .sort(([_, aTagData], [__, bTagData]) => bTagData.weight - aTagData.weight));
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
    this.sessionService.receiveRoomUpdates().subscribe(() => this.rebuildTagData());
    this._subscriptionAdminData = this._tagCloudAdmin.getAdminData.subscribe(adminData => {
      this.onReceiveAdminData(adminData, true);
    });
    this._commentSubscription = this._roomDataService.receiveUpdates([
      { type: 'CommentCreated', finished: true },
      { type: 'CommentDeleted' },
      { type: 'CommentPatched', finished: true, updates: ['score'] },
      { type: 'CommentPatched', finished: true, updates: ['downvotes'] },
      { type: 'CommentPatched', finished: true, updates: ['upvotes'] },
      { type: 'CommentPatched', finished: true, updates: ['keywordsFromSpacy'] },
      { type: 'CommentPatched', finished: true, updates: ['keywordsFromQuestioner'] },
      { type: 'CommentPatched', finished: true, updates: ['ack'] },
      { type: 'CommentPatched', finished: true, updates: ['tag'] },
    ]).subscribe(_ => {
      this.rebuildTagData();
    });
  }

  private onReceiveAdminData(data: TopicCloudAdminData, update = false) {
    this._adminData = data;
    if (update) {
      this.sessionService.getModeratorsOnce().subscribe(() => this.rebuildTagData());
    }
  }

  private getCurrentData(): TagCloudData {
    if (this._isDemoActive) {
      return this._demoData;
    }
    return this._lastFetchedData;
  }

  private calculateWeight(tagData: TagCloudDataTagEntry, tag: string): number {
    const scorings = this._adminData.scorings;
    if (this.isBrainstorming) {
      const value = this.sessionService.currentRoom.brainstormingSession?.votesForWords?.[tag];
      const upvotes = value?.upvotes || 0;
      const downvotes = value?.downvotes || 0;
      const score = upvotes - downvotes;
      return tagData.distinctUsers.size * scorings.countUsers.score +
        tagData.commentsByModerators * scorings.countKeywordByModerator.score +
        tagData.commentsByCreator * scorings.countKeywordByCreator.score +
        upvotes * scorings.summedUpvotes.score +
        downvotes * scorings.summedDownvotes.score +
        score * scorings.summedVotes.score +
        calculateControversy(upvotes, downvotes, false) * scorings.controversy.score +
        Math.max(score, 0) * scorings.cappedSummedVotes.score;
    }
    return tagData.comments.length * scorings.countComments.score +
      tagData.distinctUsers.size * scorings.countUsers.score +
      tagData.generatedByQuestionerCount * scorings.countSelectedByQuestioner.score +
      tagData.commentsByModerators * scorings.countKeywordByModerator.score +
      tagData.commentsByCreator * scorings.countKeywordByCreator.score +
      tagData.cachedUpVotes * scorings.summedUpvotes.score +
      tagData.cachedDownVotes * scorings.summedDownvotes.score +
      tagData.cachedVoteCount * scorings.summedVotes.score +
      calculateControversy(tagData.cachedUpVotes, tagData.cachedDownVotes, false) * scorings.controversy.score +
      Math.max(tagData.cachedVoteCount, 0) * scorings.cappedSummedVotes.score;
  }

  private rebuildTagData() {
    if (!this._filterObject || this._filterObject.filter.moderation) {
      return;
    }
    const filteredComments = this._filterObject.currentData;
    if (!filteredComments) {
      return;
    }
    const currentMeta = this._isDemoActive ? this._lastMetaData : this._currentMetaData;
    currentMeta.commentCount = filteredComments.comments.length;
    const room = this.sessionService.currentRoom;
    const blacklist = room.blacklist ? JSON.parse(room.blacklist) : [];
    const [data, users] = TagCloudDataService.buildDataFromComments(room.ownerId,
      new Set<string>(this.sessionService.currentModerators.map(m => m.accountId)), blacklist, room.blacklistIsActive,
      this._adminData, this._roomDataService, filteredComments.comments, this.isBrainstorming);
    let minWeight = null;
    let maxWeight = null;
    data.forEach(((value, key) => {
      value.weight = this.calculateWeight(value, key);
      minWeight = Math.min(value.weight, minWeight === null ? value.weight : minWeight);
      maxWeight = Math.max(value.weight, maxWeight === null ? value.weight : maxWeight);
    }));
    //calculate weight counts and adjusted weights
    const same = minWeight === maxWeight;
    const span = maxWeight - minWeight;
    currentMeta.countPerWeight = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (const value of data.values()) {
      value.adjustedWeight = same ? 4 : Math.round((value.weight - minWeight) * 9.0 / span);
      ++currentMeta.countPerWeight[value.adjustedWeight];
    }
    this._lastFetchedData = data;
    currentMeta.tagCount = data.size;
    currentMeta.userCount = users.size;
    currentMeta.minWeight = minWeight;
    currentMeta.maxWeight = maxWeight;
    this._metaDataBus.next(currentMeta);
    if (!this._isDemoActive) {
      this.reformatData();
    }
  }
}
