import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NotificationService } from '../../../../services/util/notification.service';
import { TopicCloudConfirmDialogComponent } from '../topic-cloud-confirm-dialog/topic-cloud-confirm-dialog.component';
import { UserRole } from '../../../../models/user-roles.enum';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../../services/util/language.service';
import { TopicCloudAdminService } from '../../../../services/util/topic-cloud-admin.service';
import { ProfanityFilterService } from '../../../../services/util/profanity-filter.service';
import { TopicCloudAdminData, Labels, spacyLabels, KeywordOrFulltext } from './TopicCloudAdminData';
import { User } from '../../../../models/user';
import { Comment } from '../../../../models/comment';
import { CommentService } from '../../../../services/http/comment.service';
import { TSMap } from 'typescript-map';
import { RoomDataService } from '../../../../services/util/room-data.service';
import { ProfanityFilter } from '../../../../models/room';

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
  blacklistSubscription = undefined;
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
  deviceType: string;
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
  isLoading: boolean;
  minQuestions: string;
  minQuestioners: string;
  minUpvotes: string;
  startDate: string;
  endDate: string;

  keywords: Keyword[] = [];
  private topicCloudAdminData: TopicCloudAdminData;
  private profanityFilter: boolean;
  private censorPartialWordsCheck: boolean;
  private censorLanguageSpecificCheck: boolean;
  private testProfanityWord: string = undefined;
  private testProfanityLanguage = 'de';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: Data,
    public cloudDialogRef: MatDialogRef<TopicCloudAdministrationComponent>,
    public confirmDialog: MatDialog,
    private notificationService: NotificationService,
    private translateService: TranslateService,
    private langService: LanguageService,
    private topicCloudAdminService: TopicCloudAdminService,
    private commentService: CommentService,
    private roomDataService: RoomDataService,
    private profanityFilterService: ProfanityFilterService) {
    this.langService.langEmitter.subscribe(lang => {
      this.translateService.use(lang);
    });
  }

  ngOnInit(): void {
    this.topicCloudAdminService.getBlacklistIsActive().subscribe(isActive => this.blacklistIsActive = isActive);
    this.deviceType = localStorage.getItem('deviceType');
    this.blacklistSubscription = this.topicCloudAdminService.getBlacklist().subscribe(list => this.blacklist = list);
    this.profanitywordlist = this.profanityFilterService.getProfanityListFromStorage();
    this.profanitylistSubscription = this.profanityFilterService.getCustomProfanityList().subscribe(list => {
      this.profanitywordlist = list;
      this.refreshKeywords();
    });
    this.isCreatorOrMod = this.data.user.role !== UserRole.PARTICIPANT;
    this.translateService.use(localStorage.getItem('currentLang'));
    this.spacyLabels = spacyLabels;
    this.wantedLabels = undefined;
    this.setDefaultAdminData();
    this.initializeKeywords();
  }

  removeFromKeywords(comment: Comment) {
    for (const keyword of this.keywords) {
      keyword.comments.forEach(_comment => {
        if (_comment.id === comment.id) {
          keyword.comments.splice(keyword.comments.indexOf(comment, 0), 1);
        }
      });
    }
    this.refreshKeywords();
  }

  refreshKeywords() {
    this.keywords = [];
    this.roomDataService.currentRoomData.forEach(comment => {
      this.pushInKeywords(comment);
    });
    if (this.searchMode) {
      this.searchKeyword();
    }
  }

  pushInKeywords(comment: Comment) {
    let _keywordType = KeywordType.fromQuestioner;
    let keywords = comment.keywordsFromQuestioner;
    if (this.keywordORfulltext === KeywordOrFulltext[KeywordOrFulltext.both]) {
      if (!keywords || !keywords.length) {
        keywords = comment.keywordsFromSpacy;
        _keywordType = KeywordType.fromSpacy;
      }
    } else if (this.keywordORfulltext === KeywordOrFulltext[KeywordOrFulltext.fulltext]) {
      keywords = comment.keywordsFromSpacy;
      _keywordType = KeywordType.fromSpacy;
    }
    if (!keywords) {
      keywords = [];
    }
    keywords.forEach(_keyword => {
      const existingKey = this.checkIfKeywordExists(_keyword);
      if (existingKey) {
        existingKey.vote += comment.score;
        if (this.checkIfCommentExists(existingKey.comments, comment.id)) {
          existingKey.comments.push(comment);
        }
      } else {
        if (this.keywordORfulltext === KeywordOrFulltext[KeywordOrFulltext.both]) {
          if (comment.keywordsFromQuestioner.includes(_keyword) && comment.keywordsFromSpacy.includes(_keyword)) {
            _keywordType = KeywordType.fromBoth;
          } else {
            _keywordType = comment.keywordsFromQuestioner.includes(_keyword) ? KeywordType.fromQuestioner : KeywordType.fromSpacy;
          }
        }
        const keyword: Keyword = {
          keyword: _keyword,
          keywordType: _keywordType,
          keywordWithoutProfanity: this.getKeywordWithoutProfanity(_keyword, comment.language),
          comments: [comment],
          vote: comment.score
        };
        this.keywords.push(keyword);
      }
    });
  }

  ngOnDestroy() {
    this.setAdminData();
    if (this.blacklistSubscription !== undefined) {
      this.blacklistSubscription.unsubscribe();
    }
    if (this.profanitylistSubscription !== undefined) {
      this.profanitylistSubscription.unsubscribe();
    }
  }

  initializeKeywords() {
    const roomId = localStorage.getItem('roomId');
    this.roomDataService.getRoomData(roomId).subscribe(comments => {
      if (comments === null) {
        return;
      }
      this.keywords = [];
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
    let profFilter = this.profanityFilter ? ProfanityFilter.none : ProfanityFilter.deactivated;
    if (this.profanityFilter) {
      if (this.censorLanguageSpecificCheck && this.censorPartialWordsCheck) {
        profFilter = ProfanityFilter.all;
      } else {
        profFilter = this.censorLanguageSpecificCheck ? ProfanityFilter.languageSpecific : ProfanityFilter.none;
        profFilter = this.censorPartialWordsCheck ? ProfanityFilter.partialWords : profFilter;
      }
    }
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
      blacklist: [],
      wantedLabels: {
        de: this.wantedLabels.de,
        en: this.wantedLabels.en
      },
      considerVotes: this.considerVotes,
      profanityFilter: profFilter,
      blacklistIsActive: this.blacklistIsActive,
      keywordORfulltext: KeywordOrFulltext[this.keywordORfulltext],
      minQuestioners: minQuestionersVerified,
      minQuestions: minQuestionsVerified,
      minUpvotes: minUpvotesVerified,
      startDate: this.startDate.length ? this.startDate : null,
      endDate: this.endDate.length ? this.endDate : null
    };
    this.topicCloudAdminService.setAdminData(this.topicCloudAdminData, true);
  }

  setDefaultAdminData() {
    this.topicCloudAdminData = TopicCloudAdminService.getDefaultAdminData;
    if (this.topicCloudAdminData) {
      this.considerVotes = this.topicCloudAdminData.considerVotes;
      this.profanityFilter = this.topicCloudAdminData.profanityFilter !== ProfanityFilter.deactivated;
      if (this.topicCloudAdminData.profanityFilter === ProfanityFilter.all) {
        this.censorLanguageSpecificCheck = this.censorPartialWordsCheck = true;
      } else if (this.profanityFilter) {
        this.censorLanguageSpecificCheck = this.topicCloudAdminData.profanityFilter === ProfanityFilter.languageSpecific;
        this.censorPartialWordsCheck = this.topicCloudAdminData.profanityFilter === ProfanityFilter.partialWords;
      }
      this.blacklistIsActive = this.topicCloudAdminData.blacklistIsActive;
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
    }
  }

  getKeywordWithoutProfanity(keyword: string, lang: string): string {
    return this.profanityFilterService.filterProfanityWords(keyword, this.censorPartialWordsCheck, this.censorLanguageSpecificCheck, lang);
  }

  sortQuestions(sortMode?: string) {
    if (sortMode !== undefined) {
      this.sortMode = sortMode;
    }
    switch (this.sortMode) {
      case 'alphabetic':
        this.keywords.sort((a, b) => a.keyword.localeCompare(b.keyword));
        break;
      case 'questionsCount':
        this.keywords.sort((a, b) => b.comments.length - a.comments.length);
        break;
      case 'voteCount':
        this.keywords.sort((a, b) => b.vote - a.vote);
        break;
    }
  }

  checkIfThereAreQuestions() {
    if (this.keywords.length === 0) {
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
      keywords.splice(keywords.indexOf(key.keyword, 0), 1);
      changes.set('keywordsFromQuestioner', JSON.stringify(keywords));
      keywords = comment.keywordsFromSpacy;
      keywords.splice(keywords.indexOf(key.keyword, 0), 1);
      changes.set('keywordsFromSpacy', JSON.stringify(keywords));
      this.updateComment(comment, changes, message);
    });

    if (this.searchMode === true) {
      this.searchKeyword();
    }
  }

  updateComment(updatedComment: Comment, changes: TSMap<string, any>, messageTranslate?: string) {
    this.commentService.patchComment(updatedComment, changes).subscribe(_ => {
      if (messageTranslate) {
        this.translateService.get('topic-cloud-dialog.' + messageTranslate).subscribe(msg => {
          this.notificationService.show(msg);
        });
      }
    },
      error => {
        this.translateService.get('topic-cloud-dialog.changes-gone-wrong').subscribe(msg => {
          this.notificationService.show(msg);
        });
      });
  }

  cancelEdit(): void {
    this.edit = false;
    this.newKeyword = undefined;
  }

  confirmEdit(key: Keyword): void {
    const key2 = this.checkIfKeywordExists(this.newKeyword);
    if (key2) {
      this.openConfirmDialog('merge-message', 'merge', key, key2);
    } else {
      key.comments.forEach(comment => {
        const changes = new TSMap<string, any>();
        let keywords = comment.keywordsFromQuestioner;
        for (let i = 0; i < keywords.length; i++) {
          if (keywords[i].toLowerCase() === key.keyword.toLowerCase()) {
            keywords[i] = this.newKeyword.trim();
          }
        }
        changes.set('keywordsFromQuestioner', JSON.stringify(keywords));
        keywords = comment.keywordsFromSpacy;
        for (let i = 0; i < keywords.length; i++) {
          if (keywords[i].toLowerCase() === key.keyword.toLowerCase()) {
            keywords[i] = this.newKeyword.trim();
          }
        }
        changes.set('keywordsFromSpacy', JSON.stringify(keywords));
        this.updateComment(comment, changes, 'keyword-edit');
      });
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
      this.filteredKeywords = this.keywords.filter(keyword =>
        keyword.keyword.toLowerCase().includes(this.searchedKeyword.toLowerCase())
      );
      this.searchMode = true;
    }
  }

  mergeKeywords(key1: Keyword, key2: Keyword) {
    if (key1 !== undefined && key2 !== undefined) {
      key1.comments.forEach(comment => {
        if (this.checkIfCommentExists(key2.comments, comment.id)) {
          const changes = new TSMap<string, any>();
          let keywords = comment.keywordsFromQuestioner;
          keywords.push(key2.keyword);
          changes.set('keywordsFromQuestioner', JSON.stringify(keywords));
          keywords = comment.keywordsFromSpacy;
          keywords.push(key2.keyword);
          changes.set('keywordsFromSpacy', JSON.stringify(keywords));
          this.updateComment(comment, changes);
        }
      });
      this.deleteKeyword(key1);
    }
  }

  checkIfKeywordExists(key: string): Keyword {
    for (const keyword of this.keywords) {
      if (keyword.keyword.toLowerCase() === key.trim().toLowerCase()) {
        return keyword;
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
    this.topicCloudAdminService.addWordToBlacklist(this.newBlacklistWord);
    this.newBlacklistWord = undefined;
  }

  removeWordFromProfanityList(word: string) {
    this.profanityFilterService.removeFromProfanityList(word);
  }

  removeWordFromBlacklist(word: string) {
    this.topicCloudAdminService.removeWordFromBlacklist(word);
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
      return this.profanityFilterService.filterProfanityWords(this.testProfanityWord, this.censorPartialWordsCheck, this.censorLanguageSpecificCheck, this.testProfanityLanguage);
    } else {
      return '';
    }
  }
}

interface Keyword {
  keyword: string;
  keywordType: KeywordType;
  keywordWithoutProfanity: string;
  comments: Comment[];
  vote: number;
}

export interface Data {
  user: User;
}

enum KeywordType {
  fromSpacy = 0,
  fromQuestioner = 1,
  fromBoth = 2
}

