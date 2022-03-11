import { Injectable } from '@angular/core';
import {
  ensureDefaultScorings,
  KeywordOrFulltext,
  spacyLabels,
  TopicCloudAdminData
} from '../../components/shared/_dialogs/topic-cloud-administration/TopicCloudAdminData';
import { RoomService } from '../http/room.service';
import { Room } from '../../models/room';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService } from './notification.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { Comment } from '../../models/comment';
import { UserRole } from '../../models/user-roles.enum';
import { CloudParameters } from '../../utils/cloud-parameters';
import { RoomDataService } from './room-data.service';
import { stopWords, superfluousSpecialCharacters } from '../../utils/stopwords';
import { escapeForRegex } from '../../utils/regex-escape';
import { TagCloudSettings } from '../../utils/TagCloudSettings';
import { ThemeService } from '../../../theme/theme.service';
import { SpacyKeyword } from '../http/spacy.service';

const words = stopWords.map(word => escapeForRegex(word).replace(/\s+/, '\\s*'));
const httpRegex = /(https?:[^\s]+(\s|$))/;
const specialCharacters = '[' + escapeForRegex(superfluousSpecialCharacters) + ']+';
const regexMaskKeyword = new RegExp('\\b(' + words.join('|') + ')\\b|' +
  httpRegex.source + '|' + specialCharacters, 'gmi');
export const maskKeyword = (keyword: string): string =>
  keyword.replace(regexMaskKeyword, '').replace(/\s+/, ' ').trim();

export type KeywordConsumer = (keyword: SpacyKeyword, isFromQuestioner: boolean) => void;

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
    private themeService: ThemeService,
  ) {
    this.adminData = new BehaviorSubject<TopicCloudAdminData>(TopicCloudAdminService.getDefaultAdminData);
  }

  static get getDefaultAdminData(): TopicCloudAdminData {
    let data: TopicCloudAdminData = JSON.parse(localStorage.getItem(this.adminKey));
    if (!data) {
      data = {
        wantedLabels: {
          de: this.getDefaultSpacyTags('de'),
          en: this.getDefaultSpacyTags('en')
        },
        considerVotes: true,
        keywordORfulltext: KeywordOrFulltext.Both,
        minQuestioners: 1,
        minQuestions: 1,
        minUpvotes: 0,
        startDate: null,
        endDate: null,
        scorings: null
      };
    }
    ensureDefaultScorings(data);
    return data;
  }

  get getAdminData(): Observable<TopicCloudAdminData> {
    return this.adminData.asObservable();
  }

  static applySettingsToRoom(room: Room, brainstormingActive: boolean, isCurrentlyDark: boolean) {
    const settings: any = CloudParameters.getCurrentParameters(isCurrentlyDark);
    const admin = TopicCloudAdminService.getDefaultAdminData;
    settings.admin = {
      considerVotes: admin.considerVotes,
      keywordORfulltext: brainstormingActive && admin.keywordORfulltext === KeywordOrFulltext.Keyword ?
        KeywordOrFulltext.Both : admin.keywordORfulltext,
      wantedLabels: admin.wantedLabels,
      minQuestioners: admin.minQuestioners,
      minQuestions: admin.minQuestions,
      minUpvotes: admin.minUpvotes,
      startDate: admin.startDate,
      endDate: admin.endDate,
      scorings: admin.scorings
    };
    room.tagCloudSettings = JSON.stringify(settings);
  }

  static approveKeywordsOfComment(comment: Comment,
                                  roomDataService: RoomDataService,
                                  config: TopicCloudAdminData,
                                  blacklist: string[],
                                  blacklistEnabled: boolean,
                                  brainstorming: boolean,
                                  keywordFunc: KeywordConsumer) {
    let source = comment.keywordsFromQuestioner;
    let isFromQuestioner = true;
    const censoredInfo = roomDataService.getCensoredInformation(comment);
    if (!censoredInfo) {
      return;
    }
    let censored = censoredInfo.keywordsFromQuestionerCensored;
    if (config.keywordORfulltext === KeywordOrFulltext.Both) {
      if (!source || !source.length) {
        isFromQuestioner = false;
        source = comment.keywordsFromSpacy;
        censored = censoredInfo.keywordsFromSpacyCensored;
      }
    } else if (config.keywordORfulltext === KeywordOrFulltext.Fulltext) {
      isFromQuestioner = false;
      source = comment.keywordsFromSpacy;
      censored = censoredInfo.keywordsFromSpacyCensored;
    }
    if (!source) {
      return;
    }
    const wantedLabels = config.wantedLabels[comment.language.toLowerCase()];
    this.approveKeywords(keywordFunc, source, censored, brainstorming, wantedLabels, isFromQuestioner,
      blacklistEnabled, blacklist);
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
      default:
    }
    currentSpacyLabels.forEach(label => {
      if (label.enabledByDefault) {
        tags.push(label.tag);
      }
    });
    return tags;
  }

  private static approveKeywords(
    keywordFunc: KeywordConsumer, keywords: SpacyKeyword[], censored: boolean[], brainstorming: boolean,
    wantedLabels: string[], isFromQuestioner: boolean, blacklistEnabled: boolean, blacklist: string[]
  ) {
    for (let i = 0; i < keywords.length; i++) {
      const keyword = keywords[i];
      if (maskKeyword(keyword.text).length < 3) {
        continue;
      }
      if (censored[i]) {
        continue;
      }
      if (!brainstorming && wantedLabels && (!keyword.dep || !keyword.dep.some(e => wantedLabels.includes(e)))) {
        continue;
      }
      if (!blacklistEnabled) {
        keywordFunc(keyword, isFromQuestioner);
        continue;
      }
      const lowerCasedKeyword = keyword.text.toLowerCase();
      if (!blacklist.some(word => lowerCasedKeyword.includes(word))) {
        keywordFunc(keyword, isFromQuestioner);
      }
    }
  }

  setAdminData(_adminData: TopicCloudAdminData, updateRoom: Room, userRole: UserRole) {
    localStorage.setItem(TopicCloudAdminService.adminKey, JSON.stringify(_adminData));
    if (!updateRoom || !userRole || userRole <= UserRole.PARTICIPANT) {
      return;
    }
    TagCloudSettings.getCurrent(this.themeService.currentTheme.isDark).applyToRoom(updateRoom);
    this.updateRoom(updateRoom);
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
    this.updateBlacklist(newList, room, 'add-successful');
  }

  removeWordFromBlacklist(word: string, room: Room) {
    if (!word || !room.blacklist || room.blacklist.length < 1) {
      return;
    }
    word = word.toLowerCase().trim();
    const newList = JSON.parse(room.blacklist).filter(e => e !== word);
    if (room.blacklist.length !== newList.length) {
      this.updateBlacklist(newList, room, 'remove-successful');
    }
  }

  updateBlacklist(list: string[], room: Room, msg?: string) {
    room.blacklist = JSON.stringify(list);
    this.updateRoom(room, msg);
  }

  updateRoom(updatedRoom: Room, message?: string) {
    this.roomService.updateRoom(updatedRoom).subscribe({
      next: () => {
        if (!message) {
          message = 'changes-successful';
        }
        this.translateService.get('topic-cloud.' + message).subscribe(msg => {
          this.notificationService.show(msg);
        });
      },
      error: () => {
        this.translateService.get('topic-cloud.changes-gone-wrong').subscribe(msg => {
          this.notificationService.show(msg);
        });
      }
    });
  }
}
