import { Injectable } from '@angular/core';
import { TopicCloudAdminData } from '../../components/shared/_dialogs/topic-cloud-administration/TopicCloudAdminData';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { TopicCloudAdminService } from './topic-cloud-admin.service';
import { CommentFilter } from '../../utils/filter-options';
import { TranslateService } from '@ngx-translate/core';
import { CloudParameters } from '../../components/shared/tag-cloud/tag-cloud.interface';
import { Comment } from '../../models/comment';
import { RoomDataService } from './room-data.service';
import { SpacyKeyword } from '../http/spacy.service';

export interface TagCloudDataTagEntry {
  weight: number;
  adjustedWeight: number;
  cachedVoteCount: number;
  cachedUpVotes: number;
  cachedDownVotes: number;
  distinctUsers: Set<number>;
  firstTimeStamp: Date;
  lastTimeStamp: Date;
  categories: Set<string>;
  dependencies: Set<string>;
  comments: Comment[];
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

export enum TagCloudCalcWeightType {
  byLength,
  byVotes,
  byLengthAndVotes
}

const DEBOUNCE_TIME = 3_000;

@Injectable({
  providedIn: 'root'
})
export class TagCloudDataService {
  private _isDemoActive: boolean;
  private _isAlphabeticallySorted: boolean;
  private _dataBus: BehaviorSubject<TagCloudData>;
  private _metaDataBus: BehaviorSubject<TagCloudMetaData>;
  private _cachedData: TagCloudData;
  private _commentSubscription = null;
  private _roomId = null;
  private _calcWeightType = TagCloudCalcWeightType.byLength;
  private _lastFetchedData: TagCloudData = null;
  private _lastFetchedComments: Comment[] = null;
  private _lastMetaData: TagCloudMetaData = null;
  private readonly _currentMetaData: TagCloudMetaData;
  private _demoData: TagCloudData = null;
  private _adminData: TopicCloudAdminData = null;
  private _subscriptionAdminData: Subscription;
  private _currentFilter: CommentFilter;
  private _debounceTimer = 0;
  private _lastDebounceTime = new Date().getTime() - DEBOUNCE_TIME;

  constructor(private _tagCloudAdmin: TopicCloudAdminService,
              private _roomDataService: RoomDataService) {
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
    this._cachedData = null;
    // Subscribe to own 'service' for caching
    this._dataBus.asObservable().subscribe(data => {
      this._cachedData = data;
    });
  }

  static buildDataFromComments(adminData: TopicCloudAdminData, comments: Comment[]): [TagCloudData, Set<number>] {
    const data: TagCloudData = new Map<string, TagCloudDataTagEntry>();
    const users = new Set<number>();
    for (const comment of comments) {
      TopicCloudAdminService.approveKeywordsOfComment(comment, adminData, (keyword: SpacyKeyword) => {
        let current: TagCloudDataTagEntry = data.get(keyword.lemma);
        const commentDate = new Date(comment.timestamp);
        if (current === undefined) {
          current = {
            cachedVoteCount: 0,
            cachedUpVotes: 0,
            cachedDownVotes: 0,
            comments: [],
            weight: 0,
            adjustedWeight: 0,
            distinctUsers: new Set<number>(),
            categories: new Set<string>(),
            dependencies: new Set<string>([...keyword.dep]),
            firstTimeStamp: commentDate,
            lastTimeStamp: commentDate
          };
          data.set(keyword.lemma, current);
        }
        keyword.dep.forEach(dependency => current.dependencies.add(dependency));
        current.cachedVoteCount += comment.score;
        current.cachedUpVotes += comment.upvotes;
        current.cachedDownVotes += comment.downvotes;
        current.distinctUsers.add(comment.userNumber);
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
      });
      users.add(comment.userNumber);
    }
    return [
      new Map<string, TagCloudDataTagEntry>([...data].filter(v => TopicCloudAdminService.isTopicAllowed(adminData,
        v[1].comments.length, v[1].distinctUsers.size, v[1].cachedUpVotes, v[1].firstTimeStamp, v[1].lastTimeStamp))),
      users
    ];
  }

  bindToRoom(roomId: string): void {
    this._currentFilter = CommentFilter.currentFilter;
    this._roomId = roomId;
    this._subscriptionAdminData = this._tagCloudAdmin.getAdminData.subscribe(adminData => {
      this.onReceiveAdminData(adminData, true);
    });
    this._tagCloudAdmin.ensureRoomBound(roomId);

    this.fetchData();
    if (!this._currentFilter.paused) {
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
  }

  unbindRoom(): void {
    this._subscriptionAdminData.unsubscribe();
    if (this._commentSubscription !== null) {
      this._commentSubscription.unsubscribe();
      this._commentSubscription = null;
    }
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
          distinctUsers: new Set<number>(),
          dependencies: new Set<string>(),
          firstTimeStamp: new Date(),
          lastTimeStamp: new Date()
        });
      }
    });
  }

  get metaData(): TagCloudMetaData {
    return this._currentMetaData;
  }

  get currentData(): TagCloudData {
    return this._cachedData;
  }

  set weightCalcType(type: TagCloudCalcWeightType) {
    if (type !== this._calcWeightType) {
      this._calcWeightType = type;
      this.rebuildTagData();
    }
  }

  get weightCalcType(): TagCloudCalcWeightType {
    return this._calcWeightType;
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

  get alphabeticallySorted(): boolean {
    return this._isAlphabeticallySorted;
  }

  blockWord(tag: string): void {
    this._tagCloudAdmin.addWordToBlacklist(tag.toLowerCase());
    this.rebuildTagData();
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
        .sort(([aTag], [bTag]) => aTag.localeCompare(bTag)));
    } else {
      newData = new Map<string, TagCloudDataTagEntry>([...current]
        .sort(([_, aTagData], [__, bTagData]) => bTagData.weight - aTagData.weight));
    }
    const currentTime = new Date().getTime();
    const diff = currentTime - this._lastDebounceTime;
    if (diff >= DEBOUNCE_TIME) {
      this._dataBus.next(newData);
      this._lastDebounceTime = currentTime;
    } else {
      clearTimeout(this._debounceTimer);
      this._debounceTimer = setTimeout(() => {
        this._dataBus.next(newData);
        this._lastDebounceTime = new Date().getTime();
      }, DEBOUNCE_TIME - diff);
    }
  }

  private onReceiveAdminData(data: TopicCloudAdminData, update = false) {
    this._adminData = data;
    this._calcWeightType = this._adminData.considerVotes ? TagCloudCalcWeightType.byLengthAndVotes : TagCloudCalcWeightType.byLength;
    if (update) {
      this.rebuildTagData();
    }
  }

  private getCurrentData(): TagCloudData {
    if (this._isDemoActive) {
      return this._demoData;
    }
    return this._lastFetchedData;
  }

  private fetchData(): void {
    this._roomDataService.getRoomData(this._roomId).subscribe((comments: Comment[]) => {
      if (comments === null) {
        return;
      }
      this._lastFetchedComments = comments;
      this.rebuildTagData();
    });
  }

  private calculateWeight(tagData: TagCloudDataTagEntry): number {
    switch (this._calcWeightType) {
      case TagCloudCalcWeightType.byVotes:
        return tagData.cachedVoteCount;
      case TagCloudCalcWeightType.byLengthAndVotes:
        return tagData.cachedVoteCount / 10.0 + tagData.comments.length;
      default:
        return tagData.comments.length;
    }
  }

  private rebuildTagData() {
    if (!this._lastFetchedComments) {
      return;
    }
    const currentMeta = this._isDemoActive ? this._lastMetaData : this._currentMetaData;
    const filteredComments = this._lastFetchedComments.filter(comment => this._currentFilter.checkComment(comment));
    currentMeta.commentCount = filteredComments.length;
    const [data, users] = TagCloudDataService.buildDataFromComments(this._adminData, filteredComments);
    let minWeight = null;
    let maxWeight = null;
    for (const value of data.values()) {
      value.weight = this.calculateWeight(value);
      minWeight = Math.min(value.weight, minWeight || value.weight);
      maxWeight = Math.max(value.weight, maxWeight || value.weight);
    }
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
