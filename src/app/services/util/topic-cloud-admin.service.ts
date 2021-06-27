import { Injectable } from '@angular/core';
import * as BadWords from 'naughty-words';
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

@Injectable({
  providedIn: 'root',
})
export class TopicCloudAdminService {
  private static readonly adminKey = 'Topic-Cloud-Admin-Data';
  private adminData: Subject<TopicCloudAdminData>;
  private blacklist: Subject<string[]>;
  private profanityWords = [];
  private customProfanityWords: Subject<string[]>;
  private readonly profanityKey = 'custom-Profanity-List';

  constructor(private roomService: RoomService,
              private translateService: TranslateService,
              private notificationService: NotificationService) {
    this.blacklist = new Subject<string[]>();
    this.adminData = new Subject<TopicCloudAdminData>();
    this.customProfanityWords = new Subject<string[]>();
    /* put all arrays of languages together */
    this.profanityWords = BadWords['en']
      .concat(BadWords['de'])
      .concat(BadWords['fr'])
      .concat(BadWords['ar'])
      .concat(BadWords['ru'])
      .concat(BadWords['tr']);
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
        _adminData.blacklist = _adminData.blacklist.concat(this.getProfanityListFromStorage().concat(this.profanityWords));
      }
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

  getProfanityListFromStorage() {
    const list = localStorage.getItem(this.profanityKey);
    return list ? JSON.parse(list) : [];
  }

  getCustomProfanityList(): Observable<string[]> {
    this.customProfanityWords.next(this.getProfanityListFromStorage());
    return this.customProfanityWords.asObservable();
  }

  addToProfanityList(word: string) {
    if (word !== undefined) {
      const plist = this.getProfanityListFromStorage();
      if (!plist.includes(word.toLowerCase().trim())) {
        plist.push(word.toLowerCase().trim());
        localStorage.setItem(this.profanityKey, JSON.stringify(plist));
        this.customProfanityWords.next(plist);
      }
    }
  }

  removeFromProfanityList(word: string) {
    const plist = this.getProfanityListFromStorage();
    plist.splice(plist.indexOf(word, 0), 1);
    localStorage.setItem(this.profanityKey, JSON.stringify(plist));
    this.customProfanityWords.next(plist);
  }

  removeProfanityList() {
    localStorage.removeItem(this.profanityKey);
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

  filterProfanityWords(str: string, censorPartialWordsCheck: boolean, censorLanguageSpecificCheck: boolean, lang?: string){
    let filteredString = str;
    let profWords = [];
    if (censorLanguageSpecificCheck) {
      profWords = BadWords[(lang !== 'AUTO' ? lang.toLowerCase() : 'de')];
    } else {
      profWords = this.profanityWords;
    }
    const toCensoredString = censorPartialWordsCheck ? str.toLowerCase() : str.toLowerCase().split(' ');
    profWords.concat(this.getProfanityListFromStorage()).forEach(word => {
      if (toCensoredString.includes(word)) {
        filteredString = this.replaceString(filteredString, word, this.generateCensoredWord(word.length));
      }
    });
    return filteredString;
  }

  private replaceString(str: string, search: string, replace: string) {
    return str.replace(new RegExp(search, 'gi'), replace);
  }

  private generateCensoredWord(count: number) {
    let res = '';
    for (let i = 0; i < count; i++) {
      res += '*';
    }
    return res;
  }
}
