import { Injectable } from '@angular/core';
import {
  ensureDefaultScorings,
  KeywordOrFulltext,
  spacyLabels,
  TopicCloudAdminData,
} from '../../components/shared/_dialogs/topic-cloud-administration/TopicCloudAdminData';
import { RoomPatch, RoomService } from '../http/room.service';
import { Room } from '../../models/room';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService } from './notification.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { UserRole } from '../../models/user-roles.enum';
import { TagCloudSettings } from '../../utils/TagCloudSettings';

@Injectable({
  providedIn: 'root',
})
export class TopicCloudAdminService {
  private static readonly adminKey = 'Topic-Cloud-Admin-Data';
  private adminData: BehaviorSubject<TopicCloudAdminData>;

  constructor(
    private roomService: RoomService,
    private translateService: TranslateService,
    private notificationService: NotificationService,
  ) {
    this.adminData = new BehaviorSubject<TopicCloudAdminData>(
      TopicCloudAdminService.getDefaultAdminData,
    );
  }

  static get getDefaultAdminData(): TopicCloudAdminData {
    let data: TopicCloudAdminData = JSON.parse(
      localStorage.getItem(this.adminKey),
    );
    if (!data) {
      data = {
        wantedLabels: {
          de: this.getDefaultSpacyTags('de'),
          en: this.getDefaultSpacyTags('en'),
          fr: this.getDefaultSpacyTags('fr'),
        },
        considerVotes: true,
        keywordORfulltext: KeywordOrFulltext.Both,
        minQuestioners: 1,
        minQuestions: 1,
        minUpvotes: 0,
        startDate: null,
        endDate: null,
        scorings: null,
      };
    }
    ensureDefaultScorings(data);
    return data;
  }

  get getAdminData(): Observable<TopicCloudAdminData> {
    return this.adminData.asObservable();
  }

  static isTopicAllowed(
    config: TopicCloudAdminData,
    comments: number,
    users: number,
    upvotes: number,
    firstTimeStamp: Date,
    lastTimeStamp: Date,
  ) {
    return !(
      config.minQuestions > comments ||
      config.minQuestioners > users ||
      config.minUpvotes > upvotes ||
      (config.startDate && new Date(config.startDate) > firstTimeStamp) ||
      (config.endDate && new Date(config.endDate) < lastTimeStamp)
    );
  }

  static isTopicRequirementDisabled(data: TopicCloudAdminData): boolean {
    return (
      data.minQuestioners === 1 &&
      data.minQuestions === 1 &&
      data.minUpvotes === 0 &&
      data.startDate === null &&
      data.endDate === null
    );
  }

  static getDefaultSpacyTags(lang: string): string[] {
    const tags: string[] = [];
    let currentSpacyLabels = [];
    switch (lang) {
      case 'de':
        currentSpacyLabels = spacyLabels.de;
        break;
      case 'en':
        currentSpacyLabels = spacyLabels.en;
        break;
      case 'fr':
        currentSpacyLabels = spacyLabels.fr;
        break;
      default:
    }
    currentSpacyLabels.forEach((label) => {
      if (label.enabledByDefault) {
        tags.push(label.tag);
      }
    });
    return tags;
  }

  isTopicRequirementActive() {
    const value = this.adminData.value;
    if (!value) {
      return false;
    }
    return !TopicCloudAdminService.isTopicRequirementDisabled(value);
  }

  setAdminData(
    _adminData: TopicCloudAdminData,
    id: string,
    userRole: UserRole,
    data?: RoomPatch,
  ) {
    localStorage.setItem(
      TopicCloudAdminService.adminKey,
      JSON.stringify(_adminData),
    );
    this.adminData.next(_adminData);
    if (!id || !userRole || userRole <= UserRole.PARTICIPANT) {
      return;
    }
    const tagCloudSettings = TagCloudSettings.getCurrent().serialize();
    this.updateRoom(id, { ...data, tagCloudSettings });
  }

  addWordToBlacklist(word: string, room: Room) {
    if (!word) {
      return;
    }
    word = word.toLowerCase().trim();
    const newList = room.blacklist ? JSON.parse(room.blacklist) : [];
    if (newList.includes(word)) {
      return;
    }
    newList.push(word);
    this.updateBlacklist(newList, room.id, 'add-successful');
  }

  removeWordFromBlacklist(word: string, room: Room) {
    if (!word || !room.blacklist || room.blacklist.length < 1) {
      return;
    }
    word = word.toLowerCase().trim();
    const newList = JSON.parse(room.blacklist).filter((e) => e !== word);
    if (room.blacklist.length !== newList.length) {
      this.updateBlacklist(newList, room.id, 'remove-successful');
    }
  }

  updateBlacklist(list: string[], id: string, msg?: string) {
    this.updateRoom(id, { blacklist: JSON.stringify(list) }, msg);
  }

  updateRoom(id: string, data: RoomPatch, message?: string) {
    this.roomService.patchRoom(id, data).subscribe({
      next: () => {
        if (!message) {
          message = 'changes-successful';
        }
        this.translateService.get('topic-cloud.' + message).subscribe((msg) => {
          this.notificationService.show(msg);
        });
      },
      error: () => {
        this.translateService
          .get('topic-cloud.changes-gone-wrong')
          .subscribe((msg) => {
            this.notificationService.show(msg);
          });
      },
    });
  }
}
