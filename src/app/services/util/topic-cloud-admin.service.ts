import { Injectable } from '@angular/core';
import * as BadWords from 'naughty-words';
import { TopicCloudAdminData, KeywordOrFulltext } from '../../components/shared/_dialogs/topic-cloud-administration/TopicCloudAdminData';
import { RoomService } from './../../services/http/room.service';
import { Room } from '../../models/room';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService } from './notification.service';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class TopicCloudAdminService {
  private profanityWords = [];
  // private blacklist = []; // should be stored in backend
  private readonly profanityKey = 'custom-Profanity-List';
  private readonly adminKey = 'Topic-Cloud-Admin-Data';

  constructor(private roomService: RoomService,
    private translateService: TranslateService,
    private notificationService: NotificationService) {
    /* put all arrays of languages together */
    this.profanityWords = BadWords['en']
      .concat(BadWords['de'])
      .concat(BadWords['fr'])
      .concat(BadWords['ar'])
      .concat(BadWords['ru'])
      .concat(BadWords['tr']);
  }

  getBlacklistWords(profanityFilter: boolean, blacklistFilter: boolean) {
    let words = [];
    if (profanityFilter) {
      // TODO: send only words that are contained in keywords
      words = words.concat(this.profanityWords).concat(this.getProfanityList());
    }
    if (blacklistFilter && this.blacklist.length > 0) {
      words = words.concat(this.blacklist);
    }
    return words;
  }

  get getAdminData(): TopicCloudAdminData {
    let data = JSON.parse(localStorage.getItem(this.adminKey));
    if (!data) {
      data = {
        blacklist: this.profanityWords,
        wantedLabels: [],
        considerVotes: false,
        profanityFilter: true,
        blacklistIsActive: false,
        keywordORfulltext: KeywordOrFulltext.keyword
      };
    }
    return data;
  }

  setAdminData(adminData: TopicCloudAdminData) {
    localStorage.setItem(this.adminKey, JSON.stringify(adminData));
  }

  filterProfanityWords(str: string): string {
    let questionWithProfanity = str;
    this.profanityWords.concat(this.getProfanityList()).map((word) => {
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

  getProfanityList(): string[] {
    const list = localStorage.getItem(this.profanityKey);
    return list ? list.split(',') : [];
  }

  addToProfanityList(word: string) {
    if (word !== undefined) {
      const newList = this.getProfanityList();
      if (newList.includes(word)) {
        return;
      }
      newList.push(word);
      localStorage.setItem(this.profanityKey, newList.toString());
    }
  }

  removeFromProfanityList(profanityWord: string) {
    const list = this.getProfanityList();
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
    return this.roomService.getRoom(localStorage.getItem('RoomId'));
  }

  addWordToBlacklist(word: string) {
    if (word !== undefined) {
      this.getRoom().subscribe(room => {
        room.blacklist = JSON.parse(room.blacklist).push(word);
        this.updateRoom(room);
      });
    }
  }

  removeWordFromBlacklist(word: string) {
    if (word !== undefined) {
      this.getRoom().subscribe(room => {
        room.blacklist = JSON.parse(room.blacklist).splice(room.blacklist.indexOf(word, 1));;
        this.updateRoom(room);
      });
    }
  }

  updateRoom(updatedRoom: Room) {
    this.roomService.updateRoom(updatedRoom).subscribe(_ => {
      this.translateService.get('room-page.changes-successful').subscribe(msg => {
        this.notificationService.show(msg);
      });
    },
      error => {
        this.translateService.get('room-page.changes-gone-wrong').subscribe(msg => {
          this.notificationService.show(msg);
        });
      });
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
