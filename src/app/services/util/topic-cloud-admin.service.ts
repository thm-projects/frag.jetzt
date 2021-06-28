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
import { Observable, Subject } from 'rxjs';
import { WsRoomService } from '..//websockets/ws-room.service';
import { ProfanityFilterService } from './profanity-filter.service';

@Injectable({
  providedIn: 'root',
})
export class TopicCloudAdminService {
  private static readonly adminKey = 'Topic-Cloud-Admin-Data';
  private adminData: Subject<TopicCloudAdminData>;
  private blacklist: Subject<string[]>;

  constructor(private roomService: RoomService,
              private translateService: TranslateService,
              private wsRoomService: WsRoomService,
              private profanityFilterService: ProfanityFilterService,
              private notificationService: NotificationService) {
    this.blacklist = new Subject<string[]>();
    this.adminData = new Subject<TopicCloudAdminData>();

    this.wsRoomService.getRoomStream(localStorage.getItem('roomId')).subscribe(msg => {
      const message = JSON.parse(msg.body);
      const room = message.payload.changes;
      if (message.type === 'RoomPatched') {
        this.blacklist.next(room.blacklist ? JSON.parse(room.blacklist) : []);
      }
    });
  }

  static get getDefaultAdminData(): TopicCloudAdminData {
    let data = JSON.parse(localStorage.getItem(this.adminKey));
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
        keywordORfulltext: KeywordOrFulltext.both
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
    this.getBlacklist().subscribe(list => {
      _adminData.blacklist = [];
      if (_adminData.blacklistIsActive) {
        _adminData.blacklist = list;
      }
      if (_adminData.profanityFilter !== ProfanityFilter.deactivated) {
        _adminData.blacklist = _adminData.blacklist.concat(this.profanityFilterService.getProfanityList);
      }
      localStorage.setItem(TopicCloudAdminService.adminKey, JSON.stringify(_adminData));
      this.adminData.next(_adminData);
    });
  }

  getBlacklist(): Observable<string[]> {
    this.getRoom().subscribe(room => {
      const list = room.blacklist ? JSON.parse(room.blacklist) : [];
      this.blacklist.next(list);
    });
    return this.blacklist.asObservable();
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
