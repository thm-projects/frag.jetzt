import { Comment } from '../../../models/comment';
import { Observable, Subject } from 'rxjs';
import { WsCommentServiceService } from '../../../services/websockets/ws-comment-service.service';
import { CommentService } from '../../../services/http/comment.service';
import { CloudParameters } from './tag-cloud.interface';

export interface TagCloudDataTagEntry {
  weight: number;
  cachedVoteCount: number;
  comments: Comment[];
}

/**
 * The key is a generated tag (out of all comments).
 */
export type TagCloudData = Map<string, TagCloudDataTagEntry>;

export interface TagCloudMetaData {
  commentCount: number;
  userCount: number;
  tagCount: number;
  minWeight: number;
  maxWeight: number;
}

const demoData: TagCloudData = new Map<string, TagCloudDataTagEntry>();
{
  const TOPIC_NAME = 'Topic'; // TODO Language Support
  for (let i = 10; i >= 1; i--) {
    demoData.set(TOPIC_NAME + ' ' + i, {cachedVoteCount: 0, comments: [], weight: i});
  }
}

export enum TagCloudDataSupplyType {
  fullText,
  keywords,
  keywordsAndFullText
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
  private _lastFetchedData: TagCloudData = null;
  private _lastFetchedComments: Comment[] = null;
  private _lastMinMaxWeights = null;
  private readonly _currentMetaData: TagCloudMetaData;

  constructor(private _wsCommentService: WsCommentServiceService,
              private _commentService: CommentService) {
    this._isDemoActive = false;
    this._isAlphabeticallySorted = false;
    this._dataBus = new Subject<TagCloudData>();
    this._currentMetaData = {tagCount: 0, commentCount: 0, userCount: 0, minWeight: 0, maxWeight: 0};
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

  get demoActive(): boolean {
    return this._isDemoActive;
  }

  set demoActive(active: boolean) {
    if (active !== this._isDemoActive) {
      this._isDemoActive = active;
      if (this._isDemoActive) {
        this._lastMinMaxWeights = [this._currentMetaData.minWeight, this._currentMetaData.maxWeight];
        [this._currentMetaData.minWeight, this._currentMetaData.maxWeight] = [1, 10];
      } else if (this._lastMinMaxWeights !== null) {
        [this._currentMetaData.minWeight, this._currentMetaData.maxWeight] = this._lastMinMaxWeights;
        this._lastMinMaxWeights = null;
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
    //TODO SORT
    if (this._isAlphabeticallySorted) {
      newData = new Map<string, TagCloudDataTagEntry>([...current]
        .sort((a, b) => a[0].localeCompare(b[0])));
    } else {
      newData = new Map<string, TagCloudDataTagEntry>([...current]
        .sort((a, b) => b[1].weight - a[1].weight));
    }
    //TODO APPLY OTHER
    this._dataBus.next(newData);
  }

  private getCurrentData(): TagCloudData {
    if (this._isDemoActive) {
      return demoData;
    }
    return this._lastFetchedData;
  }

  private onUpdateData(): void {
    this._commentService.getFilteredComments(this._roomId).subscribe((comments: Comment[]) => {
      this._lastFetchedComments = comments;
      this._currentMetaData.commentCount = comments.length;
      this.rebuildTagData();
    });
  }

  private rebuildTagData() {
    const data: TagCloudData = new Map<string, TagCloudDataTagEntry>();
    const users = new Set<number>();
    for (const comment of this._lastFetchedComments) {
      //TODO Check supply types
      for (const keyword of comment.keywords) {
        let current = data.get(keyword);
        if (current === undefined) {
          current = {cachedVoteCount: 0, comments: [], weight: 0};
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
      value.weight = value.comments.length; //TODO START USING OTHER METHODS
      minWeight = Math.min(value.weight, minWeight || value.weight);
      maxWeight = Math.max(value.weight, maxWeight || value.weight);
    }
    this._lastFetchedData = data;
    this._currentMetaData.tagCount = data.size;
    this._currentMetaData.userCount = users.size;
    this._currentMetaData.minWeight = minWeight;
    this._currentMetaData.maxWeight = maxWeight;
    this._metaDataBus.next(this._currentMetaData);
    if (!this._isDemoActive) {
      this.reformatData();
    }
  }

}
