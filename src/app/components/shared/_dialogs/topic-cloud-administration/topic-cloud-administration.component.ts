import { Component, OnDestroy, OnInit } from '@angular/core';
import { NotificationService } from '../../../../services/util/notification.service';
import { TopicCloudConfirmDialogComponent } from '../topic-cloud-confirm-dialog/topic-cloud-confirm-dialog.component';
import { UserRole } from '../../../../models/user-roles.enum';
import { TranslateService } from '@ngx-translate/core';
import { TopicCloudAdminService } from '../../../../services/util/topic-cloud-admin.service';
import {
  ensureDefaultScorings,
  keywordsScoringMinMax,
  TopicCloudAdminData,
  TopicCloudAdminDataScoringKey,
  TopicCloudAdminDataScoringObject,
} from './TopicCloudAdminData';
import { Comment } from '../../../../models/comment';
import { CommentService } from '../../../../services/http/comment.service';
import { TSMap } from 'typescript-map';
import { ProfanityFilter, Room } from '../../../../models/room';
import { SessionService } from '../../../../services/util/session.service';
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
  newKeyword = undefined;
  edit = false;
  isCreatorOrMod: boolean;
  enterBlacklistWord = false;
  newBlacklistWord: string = undefined;
  sortMode = 'alphabetic';
  searchedKeyword = undefined;
  searchMode = false;
  filteredKeywords: Keyword[] = [];
  showProfanityList = false;
  showBlacklistWordList = false;
  showSettingsPanel = false;
  userRole: UserRole;
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
    const keywords: string[] = [];
    let temp = comment.keywords?.entities;
    if (temp) {
      keywords.push(...temp);
    }
    temp = comment.keywords?.keywords;
    if (temp) {
      keywords.push(...temp);
    }
    temp = comment.keywords?.special;
    if (temp) {
      keywords.push(...temp);
    }
    if (keywords.length < 1) {
      return;
    }
    keywords.forEach((_keyword) => {
      const existingKey = this.checkIfKeywordExists(_keyword);
      if (existingKey) {
        existingKey.vote += comment.score;
        if (this.checkIfCommentExists(existingKey.comments, comment.id)) {
          existingKey.comments.push(comment);
        }
        return;
      }
      this.pushNewKeyword(comment, _keyword);
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
    return comments.findIndex((comment) => comment.id === id) > -1;
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
      considerVotes: this.considerVotes,
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
    this.minQuestioners = String(this.topicCloudAdminData.minQuestioners);
    this.minQuestions = String(this.topicCloudAdminData.minQuestions);
    this.minUpvotes = String(this.topicCloudAdminData.minUpvotes);
    this.startDate = this.topicCloudAdminData.startDate || '';
    this.endDate = this.topicCloudAdminData.endDate || '';
    this.scorings = this.topicCloudAdminData.scorings;
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
      if (comment.keywords) {
        const keywords = comment.keywords;
        let before = 0;
        let after = 0;
        if (keywords.entities) {
          before += keywords.entities.length;
          keywords.entities = keywords.entities.filter(
            (e) => e !== key.keyword,
          );
          after += keywords.entities.length;
        }
        if (keywords.keywords) {
          before += keywords.keywords.length;
          keywords.keywords = keywords.keywords.filter(
            (k) => k !== key.keyword,
          );
          after += keywords.keywords.length;
        }
        if (keywords.special) {
          before += keywords.special.length;
          keywords.special = keywords.special.filter((k) => k !== key.keyword);
          after += keywords.special.length;
        }
        if (before !== after) {
          changes.set('keywords', keywords);
        }
      }
      if (changes.length > 0) {
        this.updateComment(comment, changes, message);
      }
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
      TopicCloudAdministrationComponent.renameKeyword(
        key.comments,
        key.keyword.toLowerCase(),
        this.newKeyword,
        this.commentService,
      );
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
    if (key1 === undefined || key2 === undefined) {
      return;
    }
    const lowerKey1 = key1.keyword.toLowerCase();
    key1.comments = key1.comments.filter((comment) => {
      if (!this.checkIfCommentExists(key2.comments, comment.id)) {
        return true;
      }
      const changes = new TSMap<string, unknown>();
      if (comment.keywords) {
        const keywords = comment.keywords;
        let updated = false;
        if (keywords.entities && !keywords.entities.includes(key2.keyword)) {
          keywords.entities = keywords.entities.map((e) => {
            if (e.toLowerCase() === lowerKey1) {
              updated = true;
              return key2.keyword;
            }
            return e;
          });
        }
        if (keywords.keywords && !keywords.keywords.includes(key2.keyword)) {
          keywords.keywords = keywords.keywords.map((e) => {
            if (e.toLowerCase() === lowerKey1) {
              updated = true;
              return key2.keyword;
            }
            return e;
          });
        }
        if (keywords.special && !keywords.special.includes(key2.keyword)) {
          keywords.special = keywords.special.map((e) => {
            if (e.toLowerCase() === lowerKey1) {
              updated = true;
              return key2.keyword;
            }
            return e;
          });
        }
        if (updated) {
          changes.set('keywords', keywords);
        }
      }
      if (changes.length > 0) {
        this.updateComment(comment, changes);
      }
      return false;
    });
    this.deleteKeyword(key1);
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

  addBlacklistWord() {
    this.topicCloudAdminService.addWordToBlacklist(
      this.newBlacklistWord,
      this.sessionService.currentRoom,
    );
    this.newBlacklistWord = undefined;
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

  public static renameKeyword(
    comments: Comment[],
    lowerCaseKeyword: string,
    newKeyword: string,
    commentService: CommentService,
  ) {
    const ref = newKeyword.trim();
    comments.forEach((comment) => {
      const changes = new TSMap<string, unknown>();
      if (comment.keywords) {
        const keywords = comment.keywords;
        let updated = false;
        if (keywords.entities) {
          keywords.entities = keywords.entities.map((e) => {
            if (e.toLowerCase() === lowerCaseKeyword) {
              updated = true;
              return ref;
            }
            return e;
          });
        }
        if (keywords.keywords) {
          keywords.keywords = keywords.keywords.map((e) => {
            if (e.toLowerCase() === lowerCaseKeyword) {
              updated = true;
              return ref;
            }
            return e;
          });
        }
        if (keywords.special) {
          keywords.special = keywords.special.map((e) => {
            if (e.toLowerCase() === lowerCaseKeyword) {
              updated = true;
              return ref;
            }
            return e;
          });
        }
        if (updated) {
          changes.set('keywords', keywords);
        }
      }
      if (changes.length > 0) {
        commentService.patchComment(comment, changes).subscribe();
      }
    });
  }

  private pushNewKeyword(comment: Comment, keyword: string): void {
    const entry: Keyword = {
      keyword: keyword,
      comments: [comment],
      vote: comment.score,
    };
    if (this.blacklistIncludesKeyword(keyword) && this.blacklistIsActive) {
      this.blacklistKeywords.push(entry);
    } else {
      this.keywords.set(keyword, entry);
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
  comments: Comment[];
  vote: number;
}

export interface Data {
  userRole: UserRole;
}
