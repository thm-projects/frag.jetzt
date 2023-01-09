import { Injectable } from '@angular/core';
import { TopicCloudAdminData } from 'app/components/shared/_dialogs/topic-cloud-administration/TopicCloudAdminData';
import { BrainstormingWord } from 'app/models/brainstorming-word';
import { Room } from 'app/models/room';
import {
  calculateControversy,
  FilteredDataAccess,
} from 'app/utils/filtered-data-access';
import { SmartDebounce } from 'app/utils/smart-debounce';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { BrainstormingService } from '../http/brainstorming.service';
import {
  BrainstormingDataBuilder,
  BrainstormingTopic,
} from './brainstorming-data-builder';
import { RoomDataService } from './room-data.service';
import { SessionService } from './session.service';
import { TagCloudMetaData } from './tag-cloud-data.service';
import { TopicCloudAdminService } from './topic-cloud-admin.service';

type Data = [BrainstormingWord, BrainstormingTopic][];

@Injectable({
  providedIn: 'root',
})
export class BrainstormingDataService {
  private ideaFilter: string | null = null;
  private readonly _currentMetaData: TagCloudMetaData = {
    tagCount: 0,
    commentCount: 0,
    userCount: 0,
    minWeight: 0,
    maxWeight: 0,
    countPerWeight: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  };
  private _lastSubscription: Subscription;
  private _filterObject: FilteredDataAccess;
  private _dataBus: BehaviorSubject<Data>;
  private _metaDataBus: BehaviorSubject<TagCloudMetaData>;
  private _lastFetchedData: Data = null;
  private readonly _smartDebounce = new SmartDebounce(200, 1_000);
  private _subscriptionAdminData: Subscription;
  private _commentSubscription = null;
  private _adminData: TopicCloudAdminData = null;

  constructor(
    private roomDataService: RoomDataService,
    private brainstormingService: BrainstormingService,
    private sessionService: SessionService,
    private tagCloudAdmin: TopicCloudAdminService,
  ) {
    this._dataBus = new BehaviorSubject<Data>(null);
    this._metaDataBus = new BehaviorSubject<TagCloudMetaData>(null);
    this.sessionService.getRoom().subscribe((room) => this.onRoomUpdate(room));
  }

  get metaData(): TagCloudMetaData {
    return this._currentMetaData;
  }

  get currentData(): Data {
    return this._dataBus.value;
  }

  get ideaFiltering(): string | null {
    return this.ideaFilter;
  }

  set ideaFiltering(filter: string | null) {
    if (this.ideaFilter !== filter) {
      this.ideaFilter = filter;
      this.rebuildData();
    }
  }

  set filterObject(filter: FilteredDataAccess) {
    this._filterObject = filter;
    this._lastSubscription?.unsubscribe();
    this._lastSubscription = filter
      ?.getFilteredData()
      ?.subscribe(() => this.rebuildData());
  }

  unloadCloud() {
    this._filterObject?.detach(true);
    this.ideaFiltering = null;
  }

  blockWord(wordId: string) {
    this.brainstormingService
      .patchWord(wordId, {
        banned: true,
      })
      .subscribe();
  }

  getData(): Observable<Data> {
    return this._dataBus.asObservable();
  }

  getMetaData(): Observable<TagCloudMetaData> {
    return this._metaDataBus.asObservable();
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
      this.rebuildData();
    });
    this._subscriptionAdminData = this.tagCloudAdmin.getAdminData.subscribe(
      (adminData) => {
        this.onReceiveAdminData(adminData, true);
      },
    );
    this._commentSubscription = this.roomDataService.dataAccessor
      .receiveUpdates([
        { type: 'CommentCreated', finished: true },
        { type: 'CommentDeleted' },
      ])
      .subscribe((e) => {
        if (e.comment.brainstormingSessionId !== null) {
          this.rebuildData();
        }
      });
  }

  private onReceiveAdminData(data: TopicCloudAdminData, update = false) {
    this._adminData = data;
    if (update) {
      this.sessionService
        .getModeratorsOnce()
        .subscribe(() => this.rebuildData());
    }
  }

  private rebuildData() {
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
    const session = room.brainstormingSession;
    if (!session) {
      return;
    }
    const builder = new BrainstormingDataBuilder(
      new Set<string>(
        this.sessionService.currentModerators.map((m) => m.accountId),
      ),
      room.ownerId,
      session,
      this.ideaFilter,
    );
    builder.addComments([...filteredComments]);
    const preData = builder.getData();
    const data = Object.keys(session.wordsWithMeta)
      .map(
        (wordId) =>
          [
            session.wordsWithMeta[wordId].word,
            preData.get(wordId),
          ] as Data[number],
      )
      .filter((arr) => Boolean(arr[1]) && !arr[0].banned);
    const users = builder.getUsers();
    let minWeight = null;
    let maxWeight = null;
    data.forEach(([_, topic]) => {
      topic.weight = this.calculateWeight(topic);
      minWeight = Math.min(
        topic.weight,
        minWeight === null ? topic.weight : minWeight,
      );
      maxWeight = Math.max(
        topic.weight,
        maxWeight === null ? topic.weight : maxWeight,
      );
    });
    //calculate weight counts and adjusted weights
    const same = minWeight === maxWeight;
    const span = maxWeight - minWeight;
    currentMeta.countPerWeight = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (const [_, topic] of data.values()) {
      topic.adjustedWeight = same
        ? 4
        : Math.round(((topic.weight - minWeight) * 9.0) / span);
      ++currentMeta.countPerWeight[topic.adjustedWeight];
    }
    this._lastFetchedData = data;
    currentMeta.tagCount = data.length;
    currentMeta.userCount = users.size;
    currentMeta.minWeight = minWeight;
    currentMeta.maxWeight = maxWeight;
    this._metaDataBus.next(currentMeta);
    this.reformatData();
  }

  private reformatData(): void {
    const current = this._lastFetchedData;
    if (!current) {
      console.error('Got no data for tag cloud!');
      return;
    }
    const newData: Data = [...current];
    newData.sort((arrA, arrB) => arrB[1].weight - arrA[1].weight);
    this._smartDebounce.call(() => this._dataBus.next(newData));
  }

  private calculateWeight(topic: BrainstormingTopic) {
    return (
      topic.distinctUsers.size +
      topic.cachedVoteCount * 0.5 +
      calculateControversy(topic.cachedUpVotes, topic.cachedDownVotes, 0) * 0.25
    );
  }
}
