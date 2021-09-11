import { Injectable } from '@angular/core';
import {
  KeywordOrFulltext,
  spacyLabels,
  TopicCloudAdminData
} from '../../components/shared/_dialogs/topic-cloud-administration/TopicCloudAdminData';
import { RoomService } from '../http/room.service';
import { ProfanityFilter, Room } from '../../models/room';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService } from './notification.service';
import { WsRoomService } from '../websockets/ws-room.service';
import { ProfanityFilterService } from './profanity-filter.service';
import { BehaviorSubject, Observable, Subject, Subscription } from 'rxjs';
import { Comment } from '../../models/comment';
import { UserRole } from '../../models/user-roles.enum';
import { CloudParameters } from '../../utils/cloud-parameters';

@Injectable({
  providedIn: 'root',
})
export class TopicCloudAdminService {
  private static readonly adminKey = 'Topic-Cloud-Admin-Data';
  private adminData: BehaviorSubject<TopicCloudAdminData>;
  private blacklist: Subject<string[]>;
  private blacklistIsActive: Subject<boolean>;
  private blacklistActive: boolean;
  private _subscriptionWsRoom: Subscription;

  constructor(private roomService: RoomService,
              private translateService: TranslateService,
              private wsRoomService: WsRoomService,
              private profanityFilterService: ProfanityFilterService,
              private notificationService: NotificationService) {
    this.blacklist = new Subject<string[]>();
    this.blacklistIsActive = new Subject<boolean>();
    this.adminData = new BehaviorSubject<TopicCloudAdminData>(TopicCloudAdminService.getDefaultAdminData);
  }

  static applySettingsToRoom(room: Room) {
    const settings: any = CloudParameters.currentParameters;
    const admin = TopicCloudAdminService.getDefaultAdminData;
    settings.admin = {
      considerVotes: admin.considerVotes,
      keywordORfulltext: admin.keywordORfulltext,
      wantedLabels: admin.wantedLabels,
      minQuestioners: admin.minQuestioners,
      minQuestions: admin.minQuestions,
      minUpvotes: admin.minUpvotes,
      startDate: admin.startDate,
      endDate: admin.endDate
    };
    room.tagCloudSettings = JSON.stringify(settings);
  }

  static approveKeywordsOfComment(comment: Comment, config: TopicCloudAdminData, keywordFunc: (SpacyKeyword, boolean) => void) {
    let source = comment.keywordsFromQuestioner;
    let isFromQuestioner = true;
    if (config.keywordORfulltext === KeywordOrFulltext.both) {
      if (!source || !source.length) {
        source = comment.keywordsFromSpacy;
        isFromQuestioner = false;
      }
    } else if (config.keywordORfulltext === KeywordOrFulltext.fulltext) {
      isFromQuestioner = false;
      source = comment.keywordsFromSpacy;
    }
    if (!source) {
      return;
    }
    const wantedLabels = config.wantedLabels[comment.language.toLowerCase()];
    for (const keyword of source) {
      if (wantedLabels && !keyword.dep.some(e => wantedLabels.includes(e))) {
        continue;
      }
      let isProfanity = false;
      const lowerCasedKeyword = keyword.lemma.toLowerCase();
      for (const word of config.blacklist) {
        if (lowerCasedKeyword.includes(word)) {
          isProfanity = true;
          break;
        }
      }
      if (!isProfanity) {
        keywordFunc(keyword, isFromQuestioner);
      }
    }
  }

  static isTopicAllowed(config: TopicCloudAdminData, comments: number, users: number,
                        upvotes: number, firstTimeStamp: Date, lastTimeStamp: Date) {
    return !((config.minQuestions > comments) ||
      (config.minQuestioners > users) ||
      (config.minUpvotes > upvotes) ||
      (config.startDate && new Date(config.startDate) > firstTimeStamp) ||
      (config.endDate && new Date(config.endDate) < lastTimeStamp));
  }

  static isTopicRequirementDisabled(data: TopicCloudAdminData): boolean {
    return (data.minQuestioners === 1) && (data.minQuestions === 1) && (data.minUpvotes === 0) &&
      (data.startDate === null) && (data.endDate === null);
  }

  static get getDefaultAdminData(): TopicCloudAdminData {
    let data: TopicCloudAdminData = JSON.parse(localStorage.getItem(this.adminKey));
    if (!data) {
      data = {
        blacklist: [],
        wantedLabels: {
          de: this.getDefaultSpacyTagsDE(),
          en: this.getDefaultSpacyTagsEN()
        },
        considerVotes: true,
        profanityFilter: ProfanityFilter.none,
        blacklistIsActive: true,
        keywordORfulltext: KeywordOrFulltext.both,
        minQuestioners: 1,
        minQuestions: 1,
        minUpvotes: 0,
        startDate: null,
        endDate: null
      };
    }
    return data;
  }

  static getDefaultSpacyTagsDE(): string[] {
    const tags: string[] = [];
    spacyLabels.de.forEach(label => {
      if (label.enabledByDefault) {
        tags.push(label.tag);
      }
    });
    return tags;
  }

  static getDefaultSpacyTagsEN(): string[] {
    const tags: string[] = [];
    spacyLabels.en.forEach(label => {
      if (label.enabledByDefault) {
        tags.push(label.tag);
      }
    });
    return tags;
  }

  get getAdminData(): Observable<TopicCloudAdminData> {
    return this.adminData.asObservable();
  }

  ensureRoomBound(roomId: string, userRole: UserRole) {
    if (this._subscriptionWsRoom) {
      this._subscriptionWsRoom.unsubscribe();
      this._subscriptionWsRoom = null;
    }
    this._subscriptionWsRoom = this.wsRoomService.getRoomStream(roomId).subscribe(msg => {
      const message = JSON.parse(msg.body);
      const room = message.payload.changes;
      if (message.type === 'RoomPatched') {
        this.blacklist.next(room.blacklist ? JSON.parse(room.blacklist) : []);
        this.blacklistActive = room.blacklistIsActive;
        this.blacklistIsActive.next(room.blacklistIsActive);
        const data = TopicCloudAdminService.getDefaultAdminData;
        data.profanityFilter = room.profanityFilter;
        data.blacklistIsActive = this.blacklistActive;
        this.setAdminData(data, false, userRole);
      }
    });
    this.roomService.getRoom(roomId).subscribe(room => {
      this.blacklistActive = room.blacklistIsActive;
      const adminData = TopicCloudAdminService.getDefaultAdminData;
      const list = this.finishBlacklist(room.blacklist ? JSON.parse(room.blacklist) : [], room.blacklistIsActive, room.profanityFilter);
      let areEqual = !!adminData.blacklist && list.length === adminData.blacklist.length;
      for (let i = 0; i < list.length && areEqual; i++) {
        areEqual = list[i] === adminData.blacklist[i];
      }
      if (adminData.blacklistIsActive !== room.blacklistIsActive ||
        adminData.profanityFilter !== room.profanityFilter || !areEqual) {
        this.blacklist.next(list);
        this.blacklistIsActive.next(room.blacklistIsActive);
        this.blacklistActive = room.blacklistIsActive;
        adminData.blacklistIsActive = room.blacklistIsActive;
        adminData.profanityFilter = room.profanityFilter;
        this.setAdminData(adminData, false, userRole, list);
      }
    });
  }

  updateLocalAdminData(_adminData: TopicCloudAdminData) {
    localStorage.setItem(TopicCloudAdminService.adminKey, JSON.stringify(_adminData));
  }

  setAdminData(_adminData: TopicCloudAdminData, updateRoom: boolean, userRole: UserRole, blacklist: string[] = null) {
    localStorage.setItem(TopicCloudAdminService.adminKey, JSON.stringify(_adminData));
    if (updateRoom && userRole && userRole > UserRole.PARTICIPANT) {
      this.getRoom().subscribe(room => {
        room.blacklistIsActive = _adminData.blacklistIsActive;
        TopicCloudAdminService.applySettingsToRoom(room);
        this.updateRoom(room);
      });
      return;
    }
    const applyBlacklist = (list: string[]) => {
      _adminData.blacklist = this.finishBlacklist(list, _adminData.blacklistIsActive, _adminData.profanityFilter);
      localStorage.setItem(TopicCloudAdminService.adminKey, JSON.stringify(_adminData));
      this.adminData.next(_adminData);
    };
    if (blacklist) {
      applyBlacklist(blacklist);
      return;
    }
    const subscription = this.getBlacklist().subscribe(list => {
      _adminData.blacklistIsActive = this.blacklistActive;
      applyBlacklist(list);
      subscription.unsubscribe();
    });
  }

  getBlacklist(): Observable<string[]> {
    this.getRoom().subscribe(room => {
      const list = room.blacklist ? JSON.parse(room.blacklist) : [];
      this.blacklist.next(list);
      this.blacklistIsActive.next(room.blacklistIsActive);
      this.blacklistActive = room.blacklistIsActive;
    });
    return this.blacklist.asObservable();
  }

  getBlacklistIsActive() {
    return this.blacklistIsActive.asObservable();
  }

  getRoom(): Observable<Room> {
    return this.roomService.getRoom(localStorage.getItem('roomId'));
  }

  addWordToBlacklist(word: string) {
    if (word !== undefined) {
      this.getRoom().subscribe(room => {
        const newlist = room.blacklist ? JSON.parse(room.blacklist) : [];
        if (!newlist.includes(word.toLowerCase().trim())) {
          newlist.push(word.toLowerCase().trim());
        }
        this.updateBlacklist(newlist, room, 'add-successful');
      });
    }
  }

  removeWordFromBlacklist(word: string) {
    if (word !== undefined) {
      this.getRoom().subscribe(room => {
        if (room.blacklist && room.blacklist.length > 0) {
          const newlist = JSON.parse(room.blacklist);
          newlist.splice(newlist.indexOf(word, 0), 1);
          this.updateBlacklist(newlist, room, 'remove-successful');
        }
      });
    }
  }

  updateBlacklist(list: string[], room: Room, msg?: string) {
    room.blacklist = JSON.stringify(list);
    this.updateRoom(room, msg);
  }

  updateRoom(updatedRoom: Room, message?: string) {
    this.roomService.updateRoom(updatedRoom).subscribe(_ => {
        if (!message) {
          message = 'changes-successful';
        }
        this.translateService.get('topic-cloud.' + message).subscribe(msg => {
          this.notificationService.show(msg);
          this.blacklist.next(JSON.parse(updatedRoom.blacklist));
        });
      },
      error => {
        this.translateService.get('topic-cloud.changes-gone-wrong').subscribe(msg => {
          this.notificationService.show(msg);
        });
      });
  }

  private finishBlacklist(list: string[], blacklistIsActive: boolean, profanityFilter: ProfanityFilter): string[] {
    const blacklist = blacklistIsActive ? list : [];
    if (profanityFilter === ProfanityFilter.deactivated) {
      return blacklist;
    }
    return blacklist.concat(this.profanityFilterService.getProfanityList);
  }
}
