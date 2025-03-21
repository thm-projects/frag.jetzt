import { Component, OnDestroy, OnInit } from '@angular/core';
import { NotificationService } from '../../../../services/util/notification.service';
import { TopicCloudConfirmDialogComponent } from '../topic-cloud-confirm-dialog/topic-cloud-confirm-dialog.component';
import { UserRole } from '../../../../models/user-roles.enum';
import { TranslateService } from '@ngx-translate/core';
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
  TopicCloudAdminDataScoringObject,
} from './TopicCloudAdminData';
import { Comment } from '../../../../models/comment';
import { CommentService } from '../../../../services/http/comment.service';
import { TSMap } from 'typescript-map';
import { ProfanityFilter, Room } from '../../../../models/room';
import { SessionService } from '../../../../services/util/session.service';
import { SpacyKeyword } from '../../../../services/http/spacy.service';
import { ExplanationDialogComponent } from '../explanation-dialog/explanation-dialog.component';
import { DeviceStateService } from 'app/services/state/device-state.service';
import { ReplaySubject, takeUntil } from 'rxjs';
import {
  ROOM_ROLE_MAPPER,
  RoomStateService,
} from 'app/services/state/room-state.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { afterUpdate, uiComments } from 'app/room/state/comment-updates';
import { toObservable } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-topic-cloud-administration',
  templateUrl: './topic-cloud-administration.component.html',
  styleUrls: ['./topic-cloud-administration.component.scss'],
  standalone: false,
})
export class TopicCloudAdministrationComponent implements OnInit, OnDestroy {
  public panelOpenState = false;
  public considerVotes: boolean;
  public blacklistIsActive: boolean;
  blacklist: string[] = [];
  profanitywordlist: string[] = [];
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
    fr: string[];
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
  isMobile = false;
  isPle = false;
  private topicCloudAdminData: TopicCloudAdminData;
  private destroyer = new ReplaySubject(1);
  private comments$ = toObservable(uiComments);

  constructor(
    public cloudDialogRef: MatDialogRef<TopicCloudAdministrationComponent>,
    public confirmDialog: MatDialog,
    private notificationService: NotificationService,
    private translateService: TranslateService,
    private topicCloudAdminService: TopicCloudAdminService,
    private sessionService: SessionService,
    private commentService: CommentService,
    private profanityFilterService: ProfanityFilterService,
    private roomState: RoomStateService,
    deviceState: DeviceStateService,
  ) {
    const emptyData = {} as TopicCloudAdminData;
    ensureDefaultScorings(emptyData);
    this.defaultScorings = emptyData.scorings;
    deviceState.mobile$
      .pipe(takeUntil(this.destroyer))
      .subscribe((m) => (this.isMobile = m));
    roomState.room$.pipe(takeUntil(this.destroyer)).subscribe((room) => {
      this.isPle = room?.mode === 'PLE';
    });
  }

  ngOnInit(): void {
    this.isCreatorOrMod =
      (ROOM_ROLE_MAPPER[this.roomState.getCurrentAssignedRole()] || 0) >
      UserRole.PARTICIPANT;
    this.spacyLabels = spacyLabels;
    this.wantedLabels = undefined;
    this.sessionService.getRoomOnce().subscribe((room) => {
      this.blacklistIsActive = room.blacklistActive;
      this.blacklist = room.blacklist ? JSON.parse(room.blacklist) : [];
      this.setDefaultAdminData(room);
      this.initializeKeywords();
      this.sessionService
        .receiveRoomUpdates()
        .pipe(takeUntil(this.destroyer))
        .subscribe((_room) => {
          this.blacklistIsActive = room.blacklistActive;
          this.blacklist = _room.blacklist ? JSON.parse(_room.blacklist) : [];
          this.refreshKeywords();
        });
    });
    this.profanitywordlist =
      this.profanityFilterService.getProfanityListFromStorage();
    this.profanityFilterService
      .getCustomProfanityList()
      .pipe(takeUntil(this.destroyer))
      .subscribe((list) => {
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
    for (const [, keyword] of this.keywords.entries()) {
      const index = keyword.comments.findIndex((c) => c.id === comment.id);
      if (index >= 0) {
        keyword.comments.splice(index, 1);
      }
    }
    this.refreshKeywords();
  }

  refreshKeywords() {
    this.blacklistKeywords = [];
    this.keywords = new Map<string, Keyword>();
    uiComments().rawComments.forEach((comment) => {
      this.pushInKeywords(comment.comment);
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
    } else if (
      this.keywordORfulltext === KeywordOrFulltext[KeywordOrFulltext.Fulltext]
    ) {
      keywords = comment.keywordsFromSpacy;
      _keywordType = KeywordType.FromSpacy;
    }
    if (!keywords) {
      return;
    }
    keywords.forEach((_keyword) => {
      const existingKey = this.checkIfKeywordExists(_keyword.text);
      if (existingKey) {
        existingKey.vote += comment.score;
        _keyword.dep.forEach((dep) => existingKey.keywordDeps.add(dep));
        if (this.checkIfCommentExists(existingKey.comments, comment.id)) {
          existingKey.comments.push(comment);
        }
        return;
      }
      this.pushNewKeyword(comment, _keyword, _keywordType);
    });
  }

  ngOnDestroy() {
    this.destroyer.next(true);
    this.destroyer.complete();
  }

  save() {
    this.setAdminData();
    this.cloudDialogRef.close();
  }

  initializeKeywords() {
    this.comments$.subscribe((comments) => {
      this.keywords = new Map<string, Keyword>();
      comments.rawComments.forEach((comment) => {
        this.pushInKeywords(comment.comment);
      });
      this.sortQuestions();
      this.isLoading = false;
    });
    afterUpdate.pipe(takeUntil(this.destroyer)).subscribe((e) => {
      if (e.type === 'CommentCreated') {
        this.pushInKeywords(e.comment);
      } else if (e.type === 'CommentDeleted') {
        this.removeFromKeywords(e.comment);
      } else {
        if (this.searchMode) {
          this.searchKeyword();
        }
        this.refreshKeywords();
      }
    });
  }

  blacklistIncludesKeyword(keyword: string) {
    return (
      this.blacklistIsActive && this.blacklist.includes(keyword.toLowerCase())
    );
  }

  checkIfCommentExists(comments: Comment[], id: string): boolean {
    return comments.filter((comment) => comment.id === id).length === 0;
  }

  isTopicRequirementActive(): boolean {
    return (
      this.minQuestioners !== '1' ||
      this.minQuestions !== '1' ||
      this.minUpvotes !== '0' ||
      !!this.startDate ||
      !!this.endDate
    );
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
        en: this.wantedLabels.en,
        fr: this.wantedLabels.fr,
      },
      considerVotes: this.considerVotes,
      keywordORfulltext: KeywordOrFulltext[this.keywordORfulltext],
      minQuestioners: minQuestionersVerified,
      minQuestions: minQuestionsVerified,
      minUpvotes: minUpvotesVerified,
      startDate: this.startDate.length ? this.startDate : null,
      endDate: this.endDate.length ? this.endDate : null,
      scorings: this.scorings,
    };
    const room = this.sessionService.currentRoom;
    this.topicCloudAdminService.setAdminData(
      this.topicCloudAdminData,
      room.id,
      ROOM_ROLE_MAPPER[this.roomState.getCurrentAssignedRole()] || 0,
      {
        blacklistActive: this.blacklistIsActive,
        blacklist: JSON.stringify(this.blacklist),
        profanityFilter: this.getProfanityFilterType(),
      },
    );
  }

  setDefaultAdminData(room: Room) {
    this.topicCloudAdminData = TopicCloudAdminService.getDefaultAdminData;
    this.considerVotes = this.topicCloudAdminData.considerVotes;
    this.profanityFilter = room.profanityFilter !== ProfanityFilter.DEACTIVATED;
    if (room.profanityFilter === ProfanityFilter.ALL) {
      this.censorLanguageSpecificCheck = this.censorPartialWordsCheck = true;
    } else if (this.profanityFilter) {
      this.censorLanguageSpecificCheck =
        room.profanityFilter === ProfanityFilter.LANGUAGE_SPECIFIC;
      this.censorPartialWordsCheck =
        room.profanityFilter === ProfanityFilter.PARTIAL_WORDS;
    }
    this.blacklistIsActive = room.blacklistActive;
    this.keywordORfulltext =
      KeywordOrFulltext[this.topicCloudAdminData.keywordORfulltext];
    this.wantedLabels = {
      de: this.topicCloudAdminData.wantedLabels.de,
      en: this.topicCloudAdminData.wantedLabels.en,
      fr:
        this.topicCloudAdminData.wantedLabels.fr ??
        TopicCloudAdminService.getDefaultSpacyTags('fr'),
    };
    this.minQuestioners = String(this.topicCloudAdminData.minQuestioners);
    this.minQuestions = String(this.topicCloudAdminData.minQuestions);
    this.minUpvotes = String(this.topicCloudAdminData.minUpvotes);
    this.startDate = this.topicCloudAdminData.startDate || '';
    this.endDate = this.topicCloudAdminData.endDate || '';
    this.scorings = this.topicCloudAdminData.scorings;
  }

  getKeywordWithoutProfanity(keyword: string, lang: string): string {
    return this.profanityFilterService.filterProfanityWords(
      keyword,
      this.censorPartialWordsCheck,
      this.censorLanguageSpecificCheck,
      lang,
    )[0];
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
        entries.sort(([, a], [, b]) => b.comments.length - a.comments.length);
        break;
      case 'voteCount':
        entries.sort(([, a], [, b]) => b.vote - a.vote);
        break;
    }
    this.keywords = new Map(entries);
  }

  checkIfThereAreQuestions() {
    if (this.keywords.size === 0) {
      this.translateService
        .get('topic-cloud-dialog.no-keywords-note')
        .subscribe((msg) => {
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
    key.comments.forEach((comment) => {
      const changes = new TSMap<string, unknown>();
      let keywords = comment.keywordsFromQuestioner;
      keywords.splice(
        keywords.findIndex((e) => e.text === key.keyword),
        1,
      );
      changes.set('keywordsFromQuestioner', JSON.stringify(keywords));
      keywords = comment.keywordsFromSpacy;
      keywords.splice(
        keywords.findIndex((e) => e.text === key.keyword),
        1,
      );
      changes.set('keywordsFromSpacy', JSON.stringify(keywords));
      this.updateComment(comment, changes, message);
    });

    if (this.searchMode === true) {
      this.searchKeyword();
    }
  }

  updateComment(
    updatedComment: Comment,
    changes: TSMap<string, unknown>,
    messageTranslate?: string,
  ) {
    this.commentService.patchComment(updatedComment, changes).subscribe({
      next: () => {
        if (messageTranslate) {
          this.translateService
            .get('topic-cloud-dialog.' + messageTranslate)
            .subscribe((msg) => {
              this.notificationService.show(msg);
            });
        }
      },
      error: () => {
        this.translateService
          .get('topic-cloud-dialog.changes-gone-wrong')
          .subscribe((msg) => {
            this.notificationService.show(msg);
          });
      },
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

  openConfirmDialog(
    msg: string,
    _confirmLabel: string,
    keyword: Keyword,
    mergeTarget?: Keyword,
  ) {
    const translationPart = 'topic-cloud-confirm-dialog.' + msg;
    const confirmDialogRef = this.confirmDialog.open(
      TopicCloudConfirmDialogComponent,
      {
        data: {
          topic: keyword.keyword,
          message: translationPart,
          confirmLabel: _confirmLabel,
        },
      },
    );

    confirmDialogRef.afterClosed().subscribe((result) => {
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
        this.filteredKeywords = entries
          .filter(([, keyword]) =>
            keyword.keyword
              .toLowerCase()
              .includes(this.searchedKeyword.toLowerCase()),
          )
          .map((e) => e[1]);
      } else {
        this.filteredKeywords = this.blacklistKeywords.filter((keyword) =>
          keyword.keyword
            .toLowerCase()
            .includes(this.searchedKeyword.toLowerCase()),
        );
      }
      this.searchMode = true;
    }
  }

  mergeKeywords(key1: Keyword, key2: Keyword) {
    if (key1 !== undefined && key2 !== undefined) {
      key1.comments = key1.comments.filter((comment) => {
        if (this.checkIfCommentExists(key2.comments, comment.id)) {
          const changes = new TSMap<string, unknown>();
          const lowerKey1 = key1.keyword.toLowerCase();

          let keywords = comment.keywordsFromQuestioner;
          let index = keywords.findIndex(
            (k) => k.text.toLowerCase() === lowerKey1,
          );
          keywords[index].text = key2.keyword;
          changes.set('keywordsFromQuestioner', JSON.stringify(keywords));

          keywords = comment.keywordsFromSpacy;
          index = keywords.findIndex((k) => k.text.toLowerCase() === lowerKey1);
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
    this.topicCloudAdminService.addWordToBlacklist(
      this.newBlacklistWord,
      this.sessionService.currentRoom,
    );
    this.newBlacklistWord = undefined;
  }

  removeWordFromProfanityList(word: string) {
    this.profanityFilterService.removeFromProfanityList(word);
  }

  removeWordFromBlacklist(word: string) {
    this.topicCloudAdminService.removeWordFromBlacklist(
      word,
      this.sessionService.currentRoom,
    );
  }

  showMessage(label: string, event: boolean) {
    if (event) {
      this.translateService
        .get('topic-cloud-dialog.' + label)
        .subscribe((msg) => {
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
      this.spacyLabels.de.forEach((label) => {
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
      this.spacyLabels.en.forEach((label) => {
        this.wantedLabels.en.push(label.tag);
      });
    } else {
      this.wantedLabels.en = [];
    }
  }

  selectAllFR() {
    if (this.wantedLabels.fr.length < this.spacyLabels.fr.length) {
      this.wantedLabels.fr = [];
      this.spacyLabels.fr.forEach((label) => {
        this.wantedLabels.fr.push(label.tag);
      });
    } else {
      this.wantedLabels.fr = [];
    }
  }

  getFilteredProfanity(): string {
    if (this.testProfanityWord) {
      return this.profanityFilterService.filterProfanityWords(
        this.testProfanityWord,
        this.censorPartialWordsCheck,
        this.censorLanguageSpecificCheck,
        this.testProfanityLanguage,
      )[0];
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

  openHelp() {
    const ref = this.confirmDialog.open(ExplanationDialogComponent, {
      autoFocus: false,
    });
    ref.componentInstance.translateKey = 'explanation.cloud-configuration';
  }

  private renameKeyword(comments: Comment[], lowerCaseKeyword: string) {
    comments.forEach((comment) => {
      const changes = new TSMap<string, unknown>();
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

  private pushNewKeyword(
    comment: Comment,
    keyword: SpacyKeyword,
    keywordType: KeywordType,
  ): void {
    if (this.keywordORfulltext === KeywordOrFulltext[KeywordOrFulltext.Both]) {
      const includedFromQuestioner =
        comment.keywordsFromQuestioner.findIndex(
          (e) => e.text === keyword.text,
        ) >= 0;
      const includedFromSpacy =
        comment.keywordsFromSpacy.findIndex((e) => e.text === keyword.text) >=
        0;
      if (includedFromQuestioner && includedFromSpacy) {
        keywordType = KeywordType.FromBoth;
      } else {
        keywordType = includedFromQuestioner
          ? KeywordType.FromQuestioner
          : KeywordType.FromSpacy;
      }
    }
    const entry = {
      keyword: keyword.text,
      keywordDeps: new Set<string>(keyword.dep),
      keywordType,
      keywordWithoutProfanity: this.getKeywordWithoutProfanity(
        keyword.text,
        comment.language,
      ),
      comments: [comment],
      vote: comment.score,
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
      return this.censorPartialWordsCheck
        ? ProfanityFilter.ALL
        : ProfanityFilter.LANGUAGE_SPECIFIC;
    }
    return this.censorPartialWordsCheck
      ? ProfanityFilter.PARTIAL_WORDS
      : ProfanityFilter.NONE;
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
  FromBoth = 2,
}
