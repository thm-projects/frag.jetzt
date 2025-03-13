import { Injectable } from '@angular/core';
import { TopicCloudAdminData } from 'app/components/shared/_dialogs/topic-cloud-administration/TopicCloudAdminData';
import { Room } from 'app/models/room';
import {
  calculateControversy,
  FilteredDataAccess,
} from 'app/utils/filtered-data-access';
import { SmartDebounce } from 'app/utils/smart-debounce';
import { BehaviorSubject, filter, Observable, Subscription } from 'rxjs';
import { BrainstormingService } from '../http/brainstorming.service';
import {
  BrainstormingDataBuilder,
  BrainstormingTopic,
} from './brainstorming-data-builder';
import { SessionService } from './session.service';
import { TagCloudMetaData } from './tag-cloud-data.service';
import { TopicCloudAdminService } from './topic-cloud-admin.service';
import { afterUpdate } from 'app/room/state/comment-updates';

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
  private _dataBus: BehaviorSubject<BrainstormingTopic[]>;
  private _metaDataBus: BehaviorSubject<TagCloudMetaData>;
  private _lastFetchedData: BrainstormingTopic[] = null;
  private readonly _smartDebounce = new SmartDebounce(200, 1_000);
  private _subscriptionAdminData: Subscription;
  private _commentSubscription = null;
  private _adminData: TopicCloudAdminData = null;

  constructor(
    private brainstormingService: BrainstormingService,
    private sessionService: SessionService,
    private tagCloudAdmin: TopicCloudAdminService,
  ) {
    this._dataBus = new BehaviorSubject<BrainstormingTopic[]>(null);
    this._metaDataBus = new BehaviorSubject<TagCloudMetaData>(null);
    this.sessionService.getRoom().subscribe((room) => this.onRoomUpdate(room));
  }

  get metaData(): TagCloudMetaData {
    return this._currentMetaData;
  }

  get currentData(): BrainstormingTopic[] {
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

  getData(): Observable<BrainstormingTopic[]> {
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
    this._commentSubscription = afterUpdate
      .pipe(
        filter(
          (e) => e.type === 'CommentCreated' || e.type === 'CommentDeleted',
        ),
      )
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
    const data: BrainstormingTopic[] = [...builder.getData().values()];
    const users = builder.getUsers();
    let minWeight = null;
    let maxWeight = null;
    data.forEach((topic) => {
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
    for (const topic of data) {
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
    const newData: BrainstormingTopic[] = [...current];
    newData.sort((arrA, arrB) => arrB.weight - arrA.weight);
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
