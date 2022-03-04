import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { NotificationService } from '../../../../services/util/notification.service';
import { TopicCloudConfirmDialogComponent } from '../topic-cloud-confirm-dialog/topic-cloud-confirm-dialog.component';
import { UserRole } from '../../../../models/user-roles.enum';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../../services/util/language.service';
import { TopicCloudAdminService } from '../../../../services/util/topic-cloud-admin.service';
import { ProfanityFilterService } from '../../../../services/util/profanity-filter.service';
import {
  ensureDefaultScorings,
  KeywordOrFulltext,
  keywordsScoringMinMax,
  Labels,
  spacyLabels,
  TopicCloudAdminData,
  TopicCloudAdminDataScoringKey,
  TopicCloudAdminDataScoringObject
} from './TopicCloudAdminData';
import { Comment } from '../../../../models/comment';
import { CommentService } from '../../../../services/http/comment.service';
import { TSMap } from 'typescript-map';
import { RoomDataService } from '../../../../services/util/room-data.service';
import { ProfanityFilter, Room } from '../../../../models/room';
import { SessionService } from '../../../../services/util/session.service';
import { DeviceInfoService } from '../../../../services/util/device-info.service';
import { SpacyKeyword } from '../../../../services/http/spacy.service';

@Component({
  selector: 'app-topic-cloud-administration',
  templateUrl: './topic-cloud-administration.component.html',
  styleUrls: ['./topic-cloud-administration.component.scss']
})
export class TopicCloudAdministrationComponent implements OnInit, OnDestroy {
  public panelOpenState = false;
  public considerVotes: boolean;
  public blacklistIsActive: boolean;
  blacklist: string[] = [];
  profanitywordlist: string[] = [];
  profanitylistSubscription = undefined;
  commentServiceSubscription = undefined;
  keywordOrFulltextENUM = KeywordOrFulltext;
  newKeyword = undefined;
  edit = false;
  isCreatorOrMod: boolean;
  enterProfanityWord = false;
  enterBlacklistWord = false;
  newProfanityWord: string = undefined;
  newBlacklistWord: string = undefined;
  sortMode = 'alphabetic';
  searchedKeyword = undefined;
  searchMode = false;
  filteredKeywords: Keyword[] = [];
  showProfanityList = false;
  showBlacklistWordList = false;
  showSettingsPanel = false;
  keywordORfulltext: string = undefined;
  userRole: UserRole;
  spacyLabels: Labels;
  wantedLabels: {
    de: string[];
    en: string[];
  };
  spacyLabelsAllSelectedDE = true;
  isLoading = true;
  minQuestions: string;
  minQuestioners: string;
  minUpvotes: string;
  startDate: string;
  endDate: string;
  selectedTabIndex = 0;
  scorings: TopicCloudAdminDataScoringObject;
  scoringOptions = TopicCloudAdminDataScoringKey;
  scoringMinMax = keywordsScoringMinMax;

  keywords: Map<string, Keyword> = new Map<string, Keyword>();
  defaultScorings: TopicCloudAdminDataScoringObject;
  profanityFilter: boolean;
  censorPartialWordsCheck: boolean;
  censorLanguageSpecificCheck: boolean;
  testProfanityWord: string = undefined;
  testProfanityLanguage = 'de';
  blacklistKeywords = [];
  private subscriptionRoom = null;
  private topicCloudAdminData: TopicCloudAdminData;

  constructor(
    public cloudDialogRef: MatDialogRef<TopicCloudAdministrationComponent>,
    public confirmDialog: MatDialog,
    private notificationService: NotificationService,
    private translateService: TranslateService,
    private langService: LanguageService,
    private topicCloudAdminService: TopicCloudAdminService,
    private sessionService: SessionService,
    private commentService: CommentService,
    private roomDataService: RoomDataService,
    private profanityFilterService: ProfanityFilterService,
    public deviceInfo: DeviceInfoService,
  ) {
    this.langService.getLanguage().subscribe(lang => {
      this.translateService.use(lang);
    });
    const emptyData = {} as TopicCloudAdminData;
    ensureDefaultScorings(emptyData);
    this.defaultScorings = emptyData.scorings;
  }

  ngOnInit(): void {
    this.isCreatorOrMod = this.sessionService.currentRole > UserRole.PARTICIPANT;
    this.spacyLabels = spacyLabels;
    this.wantedLabels = undefined;
    this.sessionService.getRoomOnce().subscribe(room => {
      this.blacklistIsActive = room.blacklistIsActive;
      this.blacklist = room.blacklist ? JSON.parse(room.blacklist) : [];
      this.setDefaultAdminData(room);
      this.initializeKeywords();
      this.subscriptionRoom = this.sessionService.receiveRoomUpdates().subscribe(_room => {
        this.blacklistIsActive = room.blacklistIsActive;
        this.blacklist = _room.blacklist ? JSON.parse(_room.blacklist) : [];
        this.refreshKeywords();
      });
    });
    this.profanitywordlist = this.profanityFilterService.getProfanityListFromStorage();
    this.profanitylistSubscription = this.profanityFilterService.getCustomProfanityList().subscribe(list => {
      this.profanitywordlist = list;
      this.refreshKeywords();
    });
  }

  changeTabIndex() {
    this.selectedTabIndex = this.selectedTabIndex === 0 ? 1 : 0;
    if (this.searchMode) {
      this.searchKeyword();
    }
  }

  getValues(): Keyword[] {
    return [...this.keywords.values()];
  }

  removeFromKeywords(comment: Comment) {
    for (const [_, keyword] of this.keywords.entries()) {
      const index = keyword.comments.findIndex(c => c.id === comment.id);
      if (index >= 0) {
        keyword.comments.splice(index, 1);
      }
    }
    this.refreshKeywords();
  }

  refreshKeywords() {
    this.blacklistKeywords = [];
    this.keywords = new Map<string, Keyword>();
    this.roomDataService.getCurrentRoomData().forEach(comment => {
      this.pushInKeywords(comment);
    });
    if (this.searchMode) {
      this.searchKeyword();
    }
  }

  pushInKeywords(comment: Comment) {
    let _keywordType = KeywordType.FromQuestioner;
    let keywords = comment.keywordsFromQuestioner;
    if (this.keywordORfulltext === KeywordOrFulltext[KeywordOrFulltext.Both]) {
      if (!keywords || !keywords.length) {
        keywords = comment.keywordsFromSpacy;
        _keywordType = KeywordType.FromSpacy;
      }
    } else if (this.keywordORfulltext === KeywordOrFulltext[KeywordOrFulltext.Fulltext]) {
      keywords = comment.keywordsFromSpacy;
      _keywordType = KeywordType.FromSpacy;
    }
    if (!keywords) {
      return;
    }
    keywords.forEach(_keyword => {
      const existingKey = this.checkIfKeywordExists(_keyword.text);
      if (existingKey) {
        existingKey.vote += comment.score;
        _keyword.dep.forEach(dep => existingKey.keywordDeps.add(dep));
        if (this.checkIfCommentExists(existingKey.comments, comment.id)) {
          existingKey.comments.push(comment);
        }
        return;
      }
      this.pushNewKeyword(comment, _keyword, _keywordType);
    });
  }

  /**
   * Returns a lambda which closes the dialog on call.
   */
  buildCloseDialogActionCallback(): () => void {
    return () => this.ngOnDestroy();
  }

  /**
   * Returns a lambda which executes the dialog dedicated action on call.
   */
  buildSaveActionCallback(): () => void {
    return () => this.save();
  }

  ngOnDestroy() {
    this.profanitylistSubscription?.unsubscribe();
    this.subscriptionRoom?.unsubscribe();
    this.cloudDialogRef.close();
  }

  save() {
    this.setAdminData();
    this.ngOnDestroy();
  }

  initializeKeywords() {
    this.roomDataService.getRoomDataOnce().subscribe(comments => {
      this.keywords = new Map<string, Keyword>();
      comments.forEach(comment => {
        this.pushInKeywords(comment);
      });
      this.sortQuestions();
      this.isLoading = false;
    });
    this.commentServiceSubscription = this.roomDataService.receiveUpdates([
      { type: 'CommentCreated', finished: true },
      { type: 'CommentDeleted' },
      { type: 'CommentPatched', finished: true, updates: ['score'] },
      { type: 'CommentPatched', finished: true, updates: ['upvotes'] },
      { type: 'CommentPatched', finished: true, updates: ['downvotes'] },
      { type: 'CommentPatched', finished: true, updates: ['keywordsFromSpacy'] },
      { type: 'CommentPatched', finished: true, updates: ['keywordsFromQuestioner'] },
      { type: 'CommentPatched', finished: true, updates: ['ack'] },
      { type: 'CommentPatched', finished: true, updates: ['tag'] },
      { type: 'CommentPatched', subtype: 'ack' },
      { finished: true }
    ]).subscribe(update => {
      if (update.type === 'CommentCreated') {
        this.pushInKeywords(update.comment);
      } else if (update.type === 'CommentDeleted') {
        this.removeFromKeywords(update.comment);
      } else if (update.type === 'CommentPatched' && update.subtype === 'ack') {
        if (!update.comment.ack) {
          this.removeFromKeywords(update.comment);
        }
      }
      if (update.finished) {
        if (this.searchMode) {
          this.searchKeyword();
        }
        this.refreshKeywords();
      }
    });
  }

  blacklistIncludesKeyword(keyword: string) {
    return this.blacklistIsActive && this.blacklist.includes(keyword.toLowerCase());
  }

  checkIfCommentExists(comments: Comment[], id: string): boolean {
    return comments.filter(comment => comment.id === id).length === 0;
  }

  isTopicRequirementActive(): boolean {
    return (this.minQuestioners !== '1') || (this.minQuestions !== '1') || (this.minUpvotes !== '0') ||
      (!!this.startDate) || (!!this.endDate);
  }

  setAdminData() {
    let minQuestionersVerified = +this.minQuestioners;
    if (Number.isNaN(minQuestionersVerified) || minQuestionersVerified < 1) {
      minQuestionersVerified = 1;
    }
    let minQuestionsVerified = +this.minQuestions;
    if (Number.isNaN(minQuestionsVerified) || minQuestionsVerified < 1) {
      minQuestionsVerified = 1;
    }
    let minUpvotesVerified = +this.minUpvotes;
    if (Number.isNaN(minUpvotesVerified) || minUpvotesVerified < 0) {
      minUpvotesVerified = 0;
    }
    this.topicCloudAdminData = {
      wantedLabels: {
        de: this.wantedLabels.de,
        en: this.wantedLabels.en
      },
      considerVotes: this.considerVotes,
      keywordORfulltext: KeywordOrFulltext[this.keywordORfulltext],
      minQuestioners: minQuestionersVerified,
      minQuestions: minQuestionsVerified,
      minUpvotes: minUpvotesVerified,
      startDate: this.startDate.length ? this.startDate : null,
      endDate: this.endDate.length ? this.endDate : null,
      scorings: this.scorings
    };
    const room = this.sessionService.currentRoom;
    room.blacklistIsActive = this.blacklistIsActive;
    room.blacklist = JSON.stringify(this.blacklist);
    room.profanityFilter = this.getProfanityFilterType();
    this.topicCloudAdminService.setAdminData(this.topicCloudAdminData, room, this.sessionService.currentRole);
  }

  setDefaultAdminData(room: Room) {
    this.topicCloudAdminData = TopicCloudAdminService.getDefaultAdminData;
    this.considerVotes = this.topicCloudAdminData.considerVotes;
    this.profanityFilter = room.profanityFilter !== ProfanityFilter.DEACTIVATED;
    if (room.profanityFilter === ProfanityFilter.ALL) {
      this.censorLanguageSpecificCheck = this.censorPartialWordsCheck = true;
    } else if (this.profanityFilter) {
      this.censorLanguageSpecificCheck = room.profanityFilter === ProfanityFilter.LANGUAGE_SPECIFIC;
      this.censorPartialWordsCheck = room.profanityFilter === ProfanityFilter.PARTIAL_WORDS;
    }
    this.blacklistIsActive = room.blacklistIsActive;
    this.keywordORfulltext = KeywordOrFulltext[this.topicCloudAdminData.keywordORfulltext];
    this.wantedLabels = {
      de: this.topicCloudAdminData.wantedLabels.de,
      en: this.topicCloudAdminData.wantedLabels.en
    };
    this.minQuestioners = String(this.topicCloudAdminData.minQuestioners);
    this.minQuestions = String(this.topicCloudAdminData.minQuestions);
    this.minUpvotes = String(this.topicCloudAdminData.minUpvotes);
    this.startDate = this.topicCloudAdminData.startDate || '';
    this.endDate = this.topicCloudAdminData.endDate || '';
    this.scorings = this.topicCloudAdminData.scorings;
  }

  getKeywordWithoutProfanity(keyword: string, lang: string): string {
    return this.profanityFilterService.filterProfanityWords(keyword, this.censorPartialWordsCheck,
      this.censorLanguageSpecificCheck, lang)[0];
  }

  sortQuestions(sortMode?: string) {
    if (sortMode !== undefined) {
      this.sortMode = sortMode;
    }
    const entries = [...this.keywords.entries()];
    switch (this.sortMode) {
      case 'alphabetic':
        entries.sort(([a], [b]) => a.localeCompare(b));
        break;
      case 'questionsCount':
        entries.sort(([_, a], [__, b]) => b.comments.length - a.comments.length);
        break;
      case 'voteCount':
        entries.sort(([_, a], [__, b]) => b.vote - a.vote);
        break;
    }
    this.keywords = new Map(entries);
  }

  checkIfThereAreQuestions() {
    if (this.keywords.size === 0) {
      this.translateService.get('topic-cloud-dialog.no-keywords-note').subscribe(msg => {
        this.notificationService.show(msg);
      });
      setTimeout(() => {
        this.cloudDialogRef.close();
      }, 0);
    }
  }

  editKeyword(index: number): void {
    this.edit = true;
    setTimeout(() => {
      document.getElementById('edit-input' + index).focus();
    }, 0);
  }

  deleteKeyword(key: Keyword, message?: string): void {
    key.comments.forEach(comment => {
      const changes = new TSMap<string, any>();
      let keywords = comment.keywordsFromQuestioner;
      keywords.splice(keywords.findIndex(e => e.text === key.keyword), 1);
      changes.set('keywordsFromQuestioner', JSON.stringify(keywords));
      keywords = comment.keywordsFromSpacy;
      keywords.splice(keywords.findIndex(e => e.text === key.keyword), 1);
      changes.set('keywordsFromSpacy', JSON.stringify(keywords));
      this.updateComment(comment, changes, message);
    });

    if (this.searchMode === true) {
      this.searchKeyword();
    }
  }

  updateComment(updatedComment: Comment, changes: TSMap<string, any>, messageTranslate?: string) {
    this.commentService.patchComment(updatedComment, changes).subscribe({
      next: () => {
        if (messageTranslate) {
          this.translateService.get('topic-cloud-dialog.' + messageTranslate).subscribe(msg => {
            this.notificationService.show(msg);
          });
        }
      },
      error: error => {
        this.translateService.get('topic-cloud-dialog.changes-gone-wrong').subscribe(msg => {
          this.notificationService.show(msg);
        });
      }
    });
  }

  cancelEdit(): void {
    this.edit = false;
    this.newKeyword = undefined;
  }

  confirmEdit(key: Keyword): void {
    const key2 = this.checkIfKeywordExists(this.newKeyword);
    if (key2) {
      if (key === key2) {
        return;
      }
      this.openConfirmDialog('merge-message', 'merge', key, key2);
    } else {
      this.renameKeyword(key.comments, key.keyword.toLowerCase());
    }

    this.edit = false;
    this.newKeyword = undefined;
    this.sortQuestions();
    if (this.searchMode) {
      this.searchKeyword();
    }
  }

  openConfirmDialog(msg: string, _confirmLabel: string, keyword: Keyword, mergeTarget?: Keyword) {
    const translationPart = 'topic-cloud-confirm-dialog.' + msg;
    const confirmDialogRef = this.confirmDialog.open(TopicCloudConfirmDialogComponent, {
      data: { topic: keyword.keyword, message: translationPart, confirmLabel: _confirmLabel }
    });

    confirmDialogRef.afterClosed().subscribe(result => {
      if (result === 'delete') {
        this.deleteKeyword(keyword, 'keyword-delete');
      } else if (result === 'merge') {
        this.mergeKeywords(keyword, mergeTarget);
      }
    });
  }

  searchKeyword(): void {
    if (!this.searchedKeyword) {
      this.searchMode = false;
    } else {
      if (this.selectedTabIndex === 0) {
        const entries = [...this.keywords.entries()];
        this.filteredKeywords = entries.filter(([_, keyword]) =>
          keyword.keyword.toLowerCase().includes(this.searchedKeyword.toLowerCase())
        ).map(e => e[1]);
      } else {
        this.filteredKeywords = this.blacklistKeywords.filter(keyword =>
          keyword.keyword.toLowerCase().includes(this.searchedKeyword.toLowerCase())
        );
      }
      this.searchMode = true;
    }
  }

  mergeKeywords(key1: Keyword, key2: Keyword) {
    if (key1 !== undefined && key2 !== undefined) {
      key1.comments = key1.comments.filter(comment => {
        if (this.checkIfCommentExists(key2.comments, comment.id)) {
          const changes = new TSMap<string, any>();
          const lowerKey1 = key1.keyword.toLowerCase();

          let keywords = comment.keywordsFromQuestioner;
          let index = keywords.findIndex(k => k.text.toLowerCase() === lowerKey1);
          keywords[index].text = key2.keyword;
          changes.set('keywordsFromQuestioner', JSON.stringify(keywords));

          keywords = comment.keywordsFromSpacy;
          index = keywords.findIndex(k => k.text.toLowerCase() === lowerKey1);
          keywords[index].text = key2.keyword;
          changes.set('keywordsFromSpacy', JSON.stringify(keywords));

          this.updateComment(comment, changes);
          return false;
        }
        return true;
      });
      this.deleteKeyword(key1);
    }
  }

  checkIfKeywordExists(key: string): Keyword {
    const currentKeyword = key.toLowerCase();
    for (const keyword of this.keywords.keys()) {
      if (keyword.toLowerCase() === currentKeyword) {
        return this.keywords.get(keyword);
      }
    }
    return undefined;
  }

  focusInput(id: string) {
    setTimeout(() => {
      document.getElementById(id).focus();
    }, 100);
  }

  addProfanityWord() {
    this.profanityFilterService.addToProfanityList(this.newProfanityWord);
    this.newProfanityWord = undefined;
  }

  addBlacklistWord() {
    this.topicCloudAdminService.addWordToBlacklist(this.newBlacklistWord, this.sessionService.currentRoom);
    this.newBlacklistWord = undefined;
  }

  removeWordFromProfanityList(word: string) {
    this.profanityFilterService.removeFromProfanityList(word);
  }

  removeWordFromBlacklist(word: string) {
    this.topicCloudAdminService.removeWordFromBlacklist(word, this.sessionService.currentRoom);
  }

  showMessage(label: string, event: boolean) {
    if (event) {
      this.translateService.get('topic-cloud-dialog.' + label).subscribe(msg => {
        this.notificationService.show(msg);
      });
      if (this.searchMode) {
        this.searchKeyword();
      }
    }
    this.refreshKeywords();
  }

  selectAllDE() {
    if (this.wantedLabels.de.length < this.spacyLabels.de.length) {
      this.wantedLabels.de = [];
      this.spacyLabels.de.forEach(label => {
        this.wantedLabels.de.push(label.tag);
      });
      this.spacyLabelsAllSelectedDE = true;
    } else {
      this.wantedLabels.de = [];
      this.spacyLabelsAllSelectedDE = false;
    }
  }

  selectAllEN() {
    if (this.wantedLabels.en.length < this.spacyLabels.en.length) {
      this.wantedLabels.en = [];
      this.spacyLabels.en.forEach(label => {
        this.wantedLabels.en.push(label.tag);
      });
    } else {
      this.wantedLabels.en = [];
    }
  }

  getFilteredProfanity(): string {
    if (this.testProfanityWord) {
      // eslint-disable-next-line max-len
      return this.profanityFilterService.filterProfanityWords(this.testProfanityWord, this.censorPartialWordsCheck,
        this.censorLanguageSpecificCheck, this.testProfanityLanguage)[0];
    } else {
      return '';
    }
  }

  isDefaultScoring(): boolean {
    for (const key of Object.keys(this.defaultScorings)) {
      const subObject = this.defaultScorings[key];
      const refSubObject = this.scorings[key];
      for (const subKey in subObject) {
        if (subObject[subKey] !== refSubObject[subKey]) {
          return false;
        }
      }
    }
    return true;
  }

  setDefaultScoring() {
    for (const key of Object.keys(this.defaultScorings)) {
      this.scorings[key] = { ...this.defaultScorings[key] };
    }
  }

  private renameKeyword(comments: Comment[], lowerCaseKeyword: string) {
    comments.forEach(comment => {
      const changes = new TSMap<string, any>();
      let keywords = comment.keywordsFromQuestioner;
      for (const keyword of keywords) {
        if (keyword.text.toLowerCase() === lowerCaseKeyword) {
          keyword.text = this.newKeyword.trim();
        }
      }
      changes.set('keywordsFromQuestioner', JSON.stringify(keywords));
      keywords = comment.keywordsFromSpacy;
      for (const keyword of keywords) {
        if (keyword.text.toLowerCase() === lowerCaseKeyword) {
          keyword.text = this.newKeyword.trim();
        }
      }
      changes.set('keywordsFromSpacy', JSON.stringify(keywords));
      this.updateComment(comment, changes, 'keyword-edit');
    });
  }

  private pushNewKeyword(comment: Comment, keyword: SpacyKeyword, keywordType: KeywordType): void {
    if (this.keywordORfulltext === KeywordOrFulltext[KeywordOrFulltext.Both]) {
      const includedFromQuestioner = comment.keywordsFromQuestioner.findIndex(e => e.text === keyword.text) >= 0;
      const includedFromSpacy = comment.keywordsFromSpacy.findIndex(e => e.text === keyword.text) >= 0;
      if (includedFromQuestioner && includedFromSpacy) {
        keywordType = KeywordType.FromBoth;
      } else {
        keywordType = includedFromQuestioner ? KeywordType.FromQuestioner : KeywordType.FromSpacy;
      }
    }
    const entry = {
      keyword: keyword.text,
      keywordDeps: new Set<string>(keyword.dep),
      keywordType,
      keywordWithoutProfanity: this.getKeywordWithoutProfanity(keyword.text, comment.language),
      comments: [comment],
      vote: comment.score
    };
    if (this.blacklistIncludesKeyword(keyword.text) && this.blacklistIsActive) {
      this.blacklistKeywords.push(entry);
    } else {
      this.keywords.set(keyword.text, entry as Keyword);
    }
  }

  private getProfanityFilterType(): ProfanityFilter {
    if (!this.profanityFilter) {
      return ProfanityFilter.DEACTIVATED;
    }
    if (this.censorLanguageSpecificCheck) {
      return this.censorPartialWordsCheck ? ProfanityFilter.ALL : ProfanityFilter.LANGUAGE_SPECIFIC;
    }
    return this.censorPartialWordsCheck ? ProfanityFilter.PARTIAL_WORDS : ProfanityFilter.NONE;
  }
}

interface Keyword {
  keyword: string;
  keywordDeps: Set<string>;
  keywordType: KeywordType;
  keywordWithoutProfanity: string;
  comments: Comment[];
  vote: number;
}

export interface Data {
  userRole: UserRole;
}

enum KeywordType {
  FromSpacy = 0,
  FromQuestioner = 1,
  FromBoth = 2
}

