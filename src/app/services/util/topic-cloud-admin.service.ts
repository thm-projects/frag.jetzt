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

export type KeywordConsumer = (keyword: SpacyKeyword, isFromQuestioner: boolean, isFromAnswer: boolean) => void;

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
    let answerSource = comment.answerQuestionerKeywords;
    let isFromQuestioner = true;
    const censoredInfo = roomDataService.getCensoredInformation(comment);
    if (!censoredInfo) {
      return;
    }
    let censored = censoredInfo.keywordsFromQuestionerCensored;
    let answerCensored = censoredInfo.answerQuestionerKeywordsCensored;
    let isAnswerFromQuestioner = true;
    if (config.keywordORfulltext === KeywordOrFulltext.Both) {
      if (!source || !source.length) {
        isFromQuestioner = false;
        source = comment.keywordsFromSpacy;
        censored = censoredInfo.keywordsFromSpacyCensored;
      }
      if (!answerSource || !answerSource.length) {
        isAnswerFromQuestioner = false;
        answerSource = comment.answerFulltextKeywords;
        answerCensored = censoredInfo.answerFulltextKeywordsCensored;
      }
    } else if (config.keywordORfulltext === KeywordOrFulltext.Fulltext) {
      isFromQuestioner = false;
      isAnswerFromQuestioner = false;
      source = comment.keywordsFromSpacy;
      censored = censoredInfo.keywordsFromSpacyCensored;
      answerSource = comment.answerFulltextKeywords;
      answerCensored = censoredInfo.answerFulltextKeywordsCensored;
    }
    if (!source) {
      return;
    }
    const wantedLabels = config.wantedLabels[comment.language.toLowerCase()];
    for (let i = 0; i < source.length; i++) {
      const keyword = source[i];
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
        keywordFunc(keyword, isFromQuestioner, false);
        continue;
      }
      const lowerCasedKeyword = keyword.text.toLowerCase();
      if (!blacklist.some(word => lowerCasedKeyword.includes(word))) {
        keywordFunc(keyword, isFromQuestioner, false);
      }
    }
    for (let i = 0; i < answerSource.length; i++) {
      const keyword = answerSource[i];
      if (maskKeyword(keyword.text).length < 3) {
        continue;
      }
      if (answerCensored[i]) {
        continue;
      }
      if (!brainstorming && wantedLabels && (!keyword.dep || !keyword.dep.some(e => wantedLabels.includes(e)))) {
        continue;
      }
      if (!blacklistEnabled) {
        keywordFunc(keyword, isAnswerFromQuestioner, true);
        continue;
      }
      const lowerCasedKeyword = keyword.text.toLowerCase();
      if (!blacklist.some(word => lowerCasedKeyword.includes(word))) {
        keywordFunc(keyword, isAnswerFromQuestioner, true);
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
        wantedLabels: {
          de: this.getDefaultSpacyTagsDE(),
          en: this.getDefaultSpacyTagsEN()
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
    this.roomService.updateRoom(updatedRoom).subscribe(() => {
        if (!message) {
          message = 'changes-successful';
        }
        this.translateService.get('topic-cloud.' + message).subscribe(msg => {
          this.notificationService.show(msg);
        });
      },
      () => {
        this.translateService.get('topic-cloud.changes-gone-wrong').subscribe(msg => {
          this.notificationService.show(msg);
        });
      });
  }
}
