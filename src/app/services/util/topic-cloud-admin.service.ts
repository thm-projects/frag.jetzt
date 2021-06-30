import { Injectable } from '@angular/core';
import {
  TopicCloudAdminData,
  KeywordOrFulltext,
  spacyLabels
} from '../../components/shared/_dialogs/topic-cloud-administration/TopicCloudAdminData';
import { RoomService } from '../http/room.service';
import { ProfanityFilter, Room } from '../../models/room';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService } from './notification.service';
import { WsRoomService } from '../websockets/ws-room.service';
import { ProfanityFilterService } from './profanity-filter.service';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { Comment } from '../../models/comment';

@Injectable({
  providedIn: 'root',
})
export class TopicCloudAdminService {
  private static readonly adminKey = 'Topic-Cloud-Admin-Data';
  private adminData: BehaviorSubject<TopicCloudAdminData>;
  private blacklist: Subject<string[]>;
  private blacklistIsActive: Subject<boolean>;
  private blacklistActive: boolean;
  constructor(private roomService: RoomService,
              private translateService: TranslateService,
              private wsRoomService: WsRoomService,
              private profanityFilterService: ProfanityFilterService,
              private notificationService: NotificationService) {
    this.blacklist = new Subject<string[]>();
    this.blacklistIsActive = new Subject<boolean>();
    this.wsRoomService.getRoomStream(localStorage.getItem('roomId')).subscribe(msg => {
      const message = JSON.parse(msg.body);
      const room = message.payload.changes;
      if (message.type === 'RoomPatched') {
        this.blacklist.next(room.blacklist ? JSON.parse(room.blacklist) : []);
        this.blacklistActive = room.blacklistIsActive;
        this.blacklistIsActive.next(room.blacklistIsActive);
      }
    });
    this.adminData = new BehaviorSubject<TopicCloudAdminData>(TopicCloudAdminService.getDefaultAdminData);
  }

  static approveKeywordsOfComment(comment: Comment, config: TopicCloudAdminData, keywordFunc: (string) => void) {
    let source = comment.keywordsFromQuestioner;
    if (config.keywordORfulltext === KeywordOrFulltext.both) {
      source = !source || !source.length ? comment.keywordsFromSpacy : source;
    } else if (config.keywordORfulltext === KeywordOrFulltext.fulltext) {
      source = comment.keywordsFromSpacy;
    }
    if (!source) {
      return;
    }
    for (const keyword of source) {
      let isProfanity = false;
      const lowerCasedKeyword = keyword.toLowerCase();
      for (const word of config.blacklist) {
        if (lowerCasedKeyword.includes(word)) {
          isProfanity = true;
          break;
        }
      }
      if (!isProfanity) {
        keywordFunc(keyword);
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

  setAdminData(_adminData: TopicCloudAdminData) {
    localStorage.setItem(TopicCloudAdminService.adminKey, JSON.stringify(_adminData));
    this.getBlacklistIsActive().subscribe(isActive => {
      _adminData.blacklistIsActive = isActive;
    });
    this.getBlacklist().subscribe(list => {
      _adminData.blacklist = [];
      if (_adminData.blacklistIsActive) {
        _adminData.blacklist = list;
      }
      if (_adminData.profanityFilter !== ProfanityFilter.deactivated) {
        _adminData.blacklist = _adminData.blacklist.concat(this.profanityFilterService.getProfanityList);
      }
      localStorage.setItem(TopicCloudAdminService.adminKey, JSON.stringify(_adminData));
      _adminData.blacklistIsActive = this.blacklistActive;
      this.adminData.next(_adminData);
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
}
