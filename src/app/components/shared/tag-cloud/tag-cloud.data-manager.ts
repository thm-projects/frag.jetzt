import { Comment } from '../../../models/comment';
import { Observable, Subject } from 'rxjs';
import { WsCommentServiceService } from '../../../services/websockets/ws-comment-service.service';
import { CommentService } from '../../../services/http/comment.service';
import { CloudParameters } from './tag-cloud.interface';
import { TranslateService } from '@ngx-translate/core';

export interface TagCloudDataTagEntry {
  weight: number;
  adjustedWeight: number;
  cachedVoteCount: number;
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

export enum TagCloudDataSupplyType {
  fullText,
  keywords,
  keywordsAndFullText
}

export enum TagCloudCalcWeightType {
  byLength,
  byVotes,
  byLengthAndVotes
}

export class TagCloudDataManager {
  private _isDemoActive: boolean;
  private _isAlphabeticallySorted: boolean;
  private _dataBus: Subject<TagCloudData>;
  private _metaDataBus: Subject<TagCloudMetaData>;
  private _cachedData: TagCloudData;
  private _wsCommentSubscription = null;
  private _roomId = null;
  private _supplyType = TagCloudDataSupplyType.keywordsAndFullText;
  private _calcWeightType = TagCloudCalcWeightType.byLength;
  private _lastFetchedData: TagCloudData = null;
  private _lastFetchedComments: Comment[] = null;
  private _lastMetaData: TagCloudMetaData = null;
  private readonly _currentMetaData: TagCloudMetaData;
  private _demoData: TagCloudData = null;

  constructor(private _wsCommentService: WsCommentServiceService,
              private _commentService: CommentService) {
    this._isDemoActive = false;
    this._isAlphabeticallySorted = false;
    this._dataBus = new Subject<TagCloudData>();
    this._currentMetaData = {
      tagCount: 0,
      commentCount: 0,
      userCount: 0,
      minWeight: 0,
      maxWeight: 0,
      countPerWeight: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    };
    this._metaDataBus = new Subject<TagCloudMetaData>();
    this._cachedData = null;
    // Subscribe to own 'service' for caching
    this._dataBus.asObservable().subscribe(data => {
      this._cachedData = data;
    });
  }

  activate(roomId: string): void {
    if (this._wsCommentSubscription !== null) {
      console.error('Tag cloud data manager was already activated!');
      return;
    }
    this._roomId = roomId;
    this.onUpdateData();
    this._wsCommentSubscription = this._wsCommentService
      .getCommentStream(this._roomId).subscribe(e => this.onUpdateData());
  }

  deactivate(): void {
    if (this._wsCommentSubscription === null) {
      console.error('Tag cloud data manager was already deactivated!');
      return;
    }
    this._wsCommentSubscription.unsubscribe();
    this._wsCommentSubscription = null;
  }

  updateDemoData(translate: TranslateService): void {
    translate.get('tag-cloud.demo-data-topic').subscribe(text => {
      this._demoData = new Map<string, TagCloudDataTagEntry>();
      for (let i = 10; i >= 1; i--) {
        this._demoData.set(text.replace('%d', '' + i), {
          cachedVoteCount: 0,
          comments: [],
          weight: i,
          adjustedWeight: i - 1
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

  get dataSupplyType(): TagCloudDataSupplyType {
    return this._supplyType;
  }

  set dataSupplyType(type: TagCloudDataSupplyType) {
    if (this._supplyType !== type) {
      this._supplyType = type;
      this.rebuildTagData();
    }
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
    this._dataBus.next(newData);
  }

  private getCurrentData(): TagCloudData {
    if (this._isDemoActive) {
      return this._demoData;
    }
    return this._lastFetchedData;
  }

  private onUpdateData(): void {
    this._commentService.getFilteredComments(this._roomId).subscribe((comments: Comment[]) => {
      this._lastFetchedComments = comments;
      if (this._isDemoActive) {
        this._lastMetaData.commentCount = comments.length;
      } else {
        this._currentMetaData.commentCount = comments.length;
      }
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
    const currentMeta = this._isDemoActive ? this._lastMetaData : this._currentMetaData;
    const data: TagCloudData = new Map<string, TagCloudDataTagEntry>();
    const users = new Set<number>();
    for (const comment of this._lastFetchedComments) {
      let keywords = comment.keywordsFromQuestioner;
      if (this._supplyType === TagCloudDataSupplyType.keywordsAndFullText) {
        if (!keywords || !keywords.length) {
          keywords = comment.keywordsFromSpacy;
        }
      } else if (this._supplyType === TagCloudDataSupplyType.fullText) {
        keywords = comment.keywordsFromSpacy;
      }
      if (!keywords) {
        keywords = [];
      }
      for (const keyword of keywords) {
        //TODO Check spelling & check profanity
        let current = data.get(keyword);
        if (current === undefined) {
          current = {cachedVoteCount: 0, comments: [], weight: 0, adjustedWeight: 0};
          data.set(keyword, current);
        }
        current.cachedVoteCount += comment.score;
        current.comments.push(comment);
      }
      users.add(comment.userNumber);
    }
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
