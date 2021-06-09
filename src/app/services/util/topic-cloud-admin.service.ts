import { Injectable } from '@angular/core';
import * as BadWords from 'naughty-words';
// eslint-disable-next-line max-len
import { TopicCloudAdminData, KeywordOrFulltext, Labels, spacyLabels } from '../../components/shared/_dialogs/topic-cloud-administration/TopicCloudAdminData';
import { RoomService } from './../../services/http/room.service';
import { Room } from '../../models/room';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService } from './notification.service';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TopicCloudAdminService {
  private adminData: Subject<TopicCloudAdminData>;
  private blacklist: Subject<string[]>;
  private profanityWords = [];
  private readonly profanityKey = 'custom-Profanity-List';
  private readonly adminKey = 'Topic-Cloud-Admin-Data';
  constructor(private roomService: RoomService,
    private translateService: TranslateService,
    private notificationService: NotificationService) {
    this.blacklist = new Subject<string[]>();
    this.adminData = new Subject<TopicCloudAdminData>();
    /* put all arrays of languages together */
    this.profanityWords = BadWords['en']
      .concat(BadWords['de'])
      .concat(BadWords['fr'])
      .concat(BadWords['ar'])
      .concat(BadWords['ru'])
      .concat(BadWords['tr']);
  }

  get getAdminData(): Observable<TopicCloudAdminData>{
    return this.adminData.asObservable();
  }

  get getDefaultAdminData(): TopicCloudAdminData {
    let data = JSON.parse(localStorage.getItem(this.adminKey));
    if (!data) {
      data = {
        blacklist: [],
        wantedLabels: {
          de: this.getDefaultSpacyTagsDE(),
          en: this.getDefaultSpacyTagsEN()
        },
        considerVotes: false,
        profanityFilter: true,
        blacklistIsActive: false,
        keywordORfulltext: KeywordOrFulltext.keyword
      };
    }
    return data;
  }

  setAdminData(_adminData: TopicCloudAdminData) {
    localStorage.setItem(this.adminKey, JSON.stringify(_adminData));
    this.getBlacklist().subscribe(list => {
      _adminData.blacklist = this.getCustomProfanityList().concat(list).concat(this.profanityWords);
      this.adminData.next(_adminData);
    });
  }

  getBlacklist(): Observable<string[]> {
    // TODO: add watcher for another moderators
    this.getRoom().subscribe(room => {
      this.blacklist.next(JSON.parse(room.blacklist));
    });
    return this.blacklist.asObservable();
  }

  filterProfanityWords(str: string): string {
    let questionWithProfanity = str;
    this.profanityWords.concat(this.getCustomProfanityList()).map((word) => {
      questionWithProfanity = questionWithProfanity
        .toLowerCase()
        .includes(word.toLowerCase())
        ? this.replaceString(
          questionWithProfanity.toLowerCase(),
          word.toLowerCase(),
          this.generateCensoredWord(word.length)
        )
        : questionWithProfanity;
    });
    return questionWithProfanity;
  }

  getCustomProfanityList(): string[] {
    const list = localStorage.getItem(this.profanityKey);
    return list ? list.split(',') : [];
  }

  addToProfanityList(word: string) {
    if (word !== undefined) {
      const newList = this.getCustomProfanityList();
      if (newList.includes(word)) {
        return;
      }
      newList.push(word);
      localStorage.setItem(this.profanityKey, newList.toString());
    }
  }

  removeFromProfanityList(profanityWord: string) {
    const list = this.getCustomProfanityList();
    list.map(word => {
      if (word === profanityWord) {
        list.splice(list.indexOf(word, 0), 1);
      }
    });
    localStorage.setItem(this.profanityKey, list.toString());
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
        const newlist = JSON.parse(room.blacklist);
        newlist.push(word);
        this.updateBlacklist(newlist, room);
      });
    }
  }

  removeWordFromBlacklist(word: string) {
    if (word !== undefined) {
      this.getRoom().subscribe(room => {
        if (room.blacklist.length > 0){
          const newlist = JSON.parse(room.blacklist);
          newlist.splice(newlist.indexOf(word, 0), 1);
          this.updateBlacklist(newlist, room);
        }
      });
    }
  }

  updateBlacklist(list: string[], room: Room){
    room.blacklist = JSON.stringify(list);
    this.updateRoom(room);
  }

  updateRoom(updatedRoom: Room){
    this.roomService.updateRoom(updatedRoom).subscribe(_ => {
      this.translateService.get('topic-cloud.changes-successful').subscribe(msg => {
        this.notificationService.show(msg);
        /* update blacklist for subscribers */
        this.blacklist.next(JSON.parse(updatedRoom.blacklist));
      });
    },
      error => {
        this.translateService.get('topic-cloud.changes-gone-wrong').subscribe(msg => {
          this.notificationService.show(msg);
        });
    });
  }

  getDefaultSpacyTagsDE(): string[] {
    let tags: string[] = [];
    spacyLabels.de.forEach(label => {
      tags.push(label.tag);
    });
    return tags;
  }

  getDefaultSpacyTagsEN(): string[] {
    let tags: string[] = [];
    spacyLabels.en.forEach(label => {
      tags.push(label.tag);
    });
    return tags;
  }

  private replaceString(str: string, search: string, replace: string) {
    return str.split(search).join(replace);
  }

  private generateCensoredWord(count: number) {
    let res = '';
    for (let i = 0; i < count; i++) {
      res += '*';
    }
    return res;
  }
}
