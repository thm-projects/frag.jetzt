import {
  AfterViewInit,
  Component,
  ElementRef,
  Injector,
  Input,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
  signal,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  Language,
  LanguagetoolResult,
  LanguagetoolService,
} from '../../../services/http/languagetool.service';
import { Comment } from '../../../models/comment';
import { NotificationService } from '../../../services/util/notification.service';
import { DeepLService } from '../../../services/http/deep-l.service';
import { FormControl, Validators } from '@angular/forms';
import { BrainstormingSession } from '../../../models/brainstorming-session';
import { UserRole } from '../../../models/user-roles.enum';
import { SessionService } from '../../../services/util/session.service';
import { User } from '../../../models/user';
import {
  CommentCreateOptions,
  KeywordExtractor,
} from '../../../utils/keyword-extractor';
import { ForumComment } from '../../../utils/data-accessor';
import { forkJoin, switchMap, take } from 'rxjs';
import { UUID } from 'app/utils/ts-utils';
import { AccountStateService } from 'app/services/state/account-state.service';
import { DbLocalRoomSettingService } from 'app/services/persistence/lg/db-local-room-setting.service';
import {
  ROOM_ROLE_MAPPER,
  RoomStateService,
} from 'app/services/state/room-state.service';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-write-comment',
  templateUrl: './write-comment.component.html',
  styleUrls: ['./write-comment.component.scss'],
})
export class WriteCommentComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mobileMock') mobileMock: ElementRef<HTMLDivElement>;
  @Input() isModerator = false;
  @Input() tags: string[];
  @Input() onClose: (comment?: Comment) => unknown;
  @Input() disableCancelButton = false;
  @Input() confirmLabel = 'save';
  @Input() cancelLabel = 'cancel';
  @Input() additionalTemplate: TemplateRef<unknown>;
  @Input() enabled = true;
  @Input() isCommentAnswer = false;
  @Input() placeholder = 'comment-page.enter-comment';
  @Input() i18nSection = 'comment-page';
  @Input() isQuestionerNameEnabled = false;
  @Input() brainstormingData: BrainstormingSession;
  @Input() allowEmpty = false;
  @Input() additionalMockOffset: number = 0;
  @Input() commentReference: UUID = null;
  @Input() onlyText = false;
  @Input() rewriteCommentData: ForumComment = null;
  data = signal('');
  isSubmittingComment = false;
  selectedTag: string;
  maxTextCharacters = 2500;
  maxDataCharacters = 7500;
  // Grammarheck
  selectedLang: Language = 'auto';
  isSpellchecking = false;
  hasSpellcheckConfidence = true;
  brainstormingInfo: string;
  userRole: UserRole;
  user: User;
  readonly questionerNameMin = 2;
  readonly questionerNameMax = 30;
  questionerNameFormControl = new FormControl('', [
    Validators.minLength(this.questionerNameMin),
    Validators.maxLength(this.questionerNameMax),
  ]);
  private _hadUsedDeepl = false;
  private _mobileMockActive = false;
  private _mobileMockTimeout;
  private _mobileMockPossible = false;
  private _mockMatcher: MediaQueryList;
  private mockListener: (ev: MediaQueryListEvent) => void;
  private _keywordExtractor: KeywordExtractor;
  private _currentData: ForumComment;

  constructor(
    private notification: NotificationService,
    private translateService: TranslateService,
    public languagetoolService: LanguagetoolService,
    private deeplService: DeepLService,
    private dialog: MatDialog,
    private sessionService: SessionService,
    private accountState: AccountStateService,
    private localRoomSeting: DbLocalRoomSettingService,
    private roomState: RoomStateService,
    injector: Injector,
  ) {
    this._keywordExtractor = new KeywordExtractor(injector);
  }

  get isMobileMockActive() {
    return this._mobileMockActive;
  }

  get isMobileMockPossible() {
    return this._mobileMockPossible;
  }

  ngOnInit(): void {
    this._mockMatcher = window.matchMedia(
      '(min-width: ' +
        (1500 + this.additionalMockOffset * 2 * 0.8 + 10) +
        'px)',
    );
    this._mobileMockPossible = this._mockMatcher.matches;
    this._mockMatcher.addEventListener(
      'change',
      (this.mockListener = (e) => {
        this._mobileMockPossible = e.matches;
        if (!this._mobileMockPossible) {
          this._mobileMockActive = false;
        }
      }),
    );
    if (this.brainstormingData) {
      this.translateService
        .get('comment-page.brainstorming-placeholder', this.brainstormingData)
        .subscribe((msg) => (this.placeholder = msg));
      this.translateService
        .get(
          this.brainstormingData.maxWordCount === 1
            ? 'comment-page.brainstorming-info-single'
            : 'comment-page.brainstorming-info-multiple',
          this.brainstormingData,
        )
        .subscribe((msg) => (this.brainstormingInfo = msg));
    }
    if (this.isCommentAnswer) {
      this.maxTextCharacters = 5000;
    } else {
      this.maxTextCharacters = this.isModerator ? 5000 : 2500;
    }
    this.userRole = ROOM_ROLE_MAPPER[this.roomState.getCurrentAssignedRole()];
    this.maxDataCharacters = this.isModerator
      ? this.maxTextCharacters * 5
      : this.maxTextCharacters * 3;
    this.accountState.user$.subscribe((user) => (this.user = user));
    if (this.rewriteCommentData) {
      this.questionerNameFormControl.setValue(
        this.rewriteCommentData?.questionerName,
      );
    } else {
      forkJoin([
        this.sessionService.getRoomOnce(),
        this.accountState.user$.pipe(take(1)),
      ])
        .pipe(
          switchMap(([room, user]) =>
            this.localRoomSeting.get([room.id, user.id]),
          ),
        )
        .subscribe((data) => {
          this.questionerNameFormControl.setValue(data?.pseudonym ?? '');
        });
    }
  }

  ngAfterViewInit(): void {
    if (this.rewriteCommentData) {
      // TODO
      // this.commentData.currentData = clone(this.rewriteCommentData.body);
    }
  }

  ngOnDestroy() {
    this._mockMatcher.removeEventListener('change', this.mockListener);
  }

  buildCloseDialogActionCallback(): () => void {
    if (!this.onClose || this.disableCancelButton) {
      return undefined;
    }
    return () => this.onClose();
  }

  buildCreateCommentActionCallback(): () => void {
    return () => {
      this.createComment();
    };
  }

  checkGrammar() {
    // TODO
    // this.grammarCheck(this.commentData.currentText);
  }

  grammarCheck(): void {
    this.isSpellchecking = true;
    this.hasSpellcheckConfidence = true;
    //TODO
    // this.checkSpellings(rawText).subscribe({
    //   next: (wordsCheck) => {
    //     if (!this.checkLanguageConfidence(wordsCheck)) {
    //       this.hasSpellcheckConfidence = false;
    //       this.isSpellchecking = false;
    //       return;
    //     }
    //     if (wordsCheck.language.name.includes('German')) {
    //       this.selectedLang = 'de-DE';
    //     } else if (wordsCheck.language.name.includes('English')) {
    //       this.selectedLang = 'en-US';
    //     } else if (wordsCheck.language.name.includes('French')) {
    //       this.selectedLang = 'fr';
    //     } else {
    //       this.selectedLang = 'auto';
    //     }

    //     const previous = this.commentData.currentData;
    //     this.openDeeplDialog(
    //       previous,
    //       rawText,
    //       wordsCheck,
    //       (selected, submitted) => {
    //         if (selected.view === this.commentData) {
    //           this._hadUsedDeepl = false;
    //           if (wordsCheck.matches.length === 0) {
    //             this.translateService
    //               .get('deepl.no-optimization')
    //               .subscribe((msg) => this.notification.show(msg));
    //           } else {
    //             this.commentData.buildMarks(rawText, wordsCheck);
    //           }
    //         } else {
    //           this._hadUsedDeepl = true;
    //           this.commentData.currentData = selected.body;
    //           this.commentData.copyMarks(selected.view);
    //         }
    //         if (submitted) {
    //           this.createComment();
    //         }
    //       },
    //     );
    //   },
    //   error: () => {
    //     this.isSpellchecking = false;
    //   },
    // });
  }

  checkLanguageConfidence(wordsCheck: LanguagetoolResult) {
    return this.selectedLang === 'auto'
      ? wordsCheck.language.detectedLanguage.confidence >= 0.5
      : true;
  }

  isSpellcheckingButtonDisabled(): boolean {
    //TODO
    // const text = this.commentData.currentText;
    // return text.length < 5 || text.trim().split(/\s+/, 4).length < 4;
    return false;
  }

  checkSpellings(text: string, language: Language = this.selectedLang) {
    return this.languagetoolService.checkSpellings(text, language);
  }

  getContent(): ForumComment {
    // TODO
    // const data = this.commentData.currentData;
    const data = '';
    if (
      this._currentData &&
      this._currentData.body === data &&
      this._currentData.questionerName ===
        this.questionerNameFormControl.value &&
      this._currentData.tag === this.selectedTag
    ) {
      return this._currentData;
    }
    this._currentData = {
      body: data,
      number: '?',
      upvotes: 0,
      downvotes: 0,
      score: 0,
      createdAt: new Date(),
      questionerName: this.questionerNameFormControl.value,
      tag: this.selectedTag,
      children: new Set<ForumComment>(),
      totalAnswerCounts: {
        accumulated: 0,
        fromCreator: 0,
        fromModerators: 0,
        fromParticipants: 0,
      },
      answerCounts: {
        accumulated: 0,
        fromCreator: 0,
        fromModerators: 0,
        fromParticipants: 0,
      },
    } as unknown as ForumComment;
    return this._currentData;
  }

  setMobileMockState(activate: boolean) {
    clearTimeout(this._mobileMockTimeout);
    if (activate) {
      this._mobileMockActive = true;
      this._mobileMockTimeout = setTimeout(() => {
        const style = this.mobileMock?.nativeElement?.style;
        if (!style) {
          return;
        }
        style.setProperty('--current-position', 'var(--end-position)');
        style.setProperty(
          '--additional-padding',
          this.additionalMockOffset === 0
            ? '0'
            : this.additionalMockOffset + 'px',
        );
        style.opacity = '1';
      });
    } else {
      this._mobileMockTimeout = setTimeout(
        () => (this._mobileMockActive = false),
        500,
      );
      const style = this.mobileMock?.nativeElement?.style;
      if (!style) {
        return;
      }
      style.setProperty('--current-position', '');
      style.opacity = '0';
    }
  }

  private createComment() {
    const options: CommentCreateOptions = {
      userId: this.user.id,
      brainstormingSessionId: this.brainstormingData?.id || null,
      brainstormingLanguage: this.brainstormingData?.language || 'en',
      body: this.data(),
      tag: this.selectedTag,
      questionerName: this.questionerNameFormControl.value,
      callbackFinished: () => (this.isSubmittingComment = false),
      isModerator: this.userRole > 0,
      hadUsedDeepL: this._hadUsedDeepl,
      selectedLanguage: this.selectedLang,
      commentReference: this.commentReference,
      keywordExtractionActive:
        this.sessionService.currentRoom?.keywordExtractionActive,
    };
    this.onClose(this._keywordExtractor.createPlainComment(options));
    // TODO
    // let allowed = true;
    //const data = this.commentData.currentData;
    //const text = this.commentData.currentText;
    // const data = '';
    // const text = '';
    // if (this.isQuestionerNameEnabled) {
    //   this.questionerNameFormControl.setValue(
    //     (this.questionerNameFormControl.value || '').trim(),
    //   );
    //   allowed =
    //     !this.questionerNameFormControl.hasError('minlength') &&
    //     !this.questionerNameFormControl.hasError('maxlength');
    // }
    // if (
    //   this.brainstormingData &&
    //   SharedTextFormatting.getWords(text).length >
    //     this.brainstormingData.maxWordCount
    // ) {
    //   this.translateService
    //     .get('comment-page.error-comment-brainstorming', this.brainstormingData)
    //     .subscribe((msg) => this.notification.show(msg));
    //   allowed = false;
    // }
    // if (
    //   this.allowEmpty ||
    //   (this.checkInputData(
    //     data,
    //     text,
    //     this.translateService,
    //     this.notification,
    //     this.maxTextCharacters,
    //     this.maxDataCharacters,
    //   ) &&
    //     allowed)
    // ) {
    //   const realData = this.allowEmpty && text.length < 2 ? '' : data;
    //   const options: CommentCreateOptions = {
    //     userId: this.user.id,
    //     brainstormingSessionId: this.brainstormingData?.id || null,
    //     brainstormingLanguage: this.brainstormingData?.language || 'en',
    //     body: realData,
    //     tag: this.selectedTag,
    //     questionerName: this.questionerNameFormControl.value,
    //     callbackFinished: () => (this.isSubmittingComment = false),
    //     isModerator: this.userRole > 0,
    //     hadUsedDeepL: this._hadUsedDeepl,
    //     selectedLanguage: this.selectedLang,
    //     commentReference: this.commentReference,
    //     keywordExtractionActive:
    //       this.sessionService.currentRoom?.keywordExtractionActive,
    //   };
    //   if (this.onlyText) {
    //     this.onClose(this._keywordExtractor.createPlainComment(options));
    //     return;
    //   }
    //   this.isSubmittingComment = true;
    //   this._keywordExtractor.createCommentInteractive(options).subscribe({
    //     next: (comment) => {
    //       localStorage.setItem('comment-created', String(true));
    //       this.onClose(comment);
    //     },
    //     error: () => {
    //       // Ignore
    //     },
    //   });
    // }
  }

  private openDeeplDialog() {
    // TODO
    // let target = TargetLang.EN_US;
    // const code = result.language.detectedLanguage.code
    //   .toUpperCase()
    //   .split('-')[0];
    // const source = code in SourceLang ? SourceLang[code] : null;
    // if (code.startsWith(SourceLang.EN)) {
    //   target = TargetLang.DE;
    // }
    // forkJoin([
    //   this.deeplService.improveDelta(body, target, FormalityType.Less),
    //   of(FormalityType.Less),
    // ]).subscribe({
    //   next: ([[improvedBody, improvedText], formality]) => {
    //     this.isSpellchecking = false;
    //     if (improvedText.replace(/\s+/g, '') === text.replace(/\s+/g, '')) {
    //       this.translateService
    //         .get('deepl.no-optimization')
    //         .subscribe((msg) => this.notification.show(msg));
    //       onClose({ body, text, view: this.commentData });
    //       return;
    //     }
    //     const instance = this.dialog.open(DeepLDialogComponent, {
    //       width: '900px',
    //       maxWidth: '100%',
    //       data: {
    //         body,
    //         text,
    //         improvedBody,
    //         improvedText,
    //         maxTextCharacters: this.maxTextCharacters,
    //         maxDataCharacters: this.maxDataCharacters,
    //         isModerator: this.isModerator,
    //         result,
    //         onClose,
    //         target: DeepLService.transformSourceToTarget(source),
    //         usedTarget: target,
    //         formality,
    //       },
    //     });
    //     instance.afterClosed().subscribe((val) => {
    //       if (!val) {
    //         onClose({ body, text, view: this.commentData });
    //       }
    //     });
    //   },
    //   error: (err) => {
    //     console.error(err);
    //     this.isSpellchecking = false;
    //     onClose({ body, text, view: this.commentData });
    //   },
    // });
  }

  public checkInputData(
    data: string,
    text: string,
    translateService: TranslateService,
    notificationService: NotificationService,
    maxTextCharacters: number,
    maxDataCharacters: number,
  ): boolean {
    text = text.trim();
    if (data.length < 1) {
      translateService
        .get('comment-page.error-comment')
        .subscribe((message) => {
          notificationService.show(message);
        });
      return false;
    } else if (text.length > maxTextCharacters) {
      translateService
        .get('comment-page.error-comment-text')
        .subscribe((message) => {
          notificationService.show(message);
        });
      return false;
    } else if (data.length > maxDataCharacters) {
      translateService
        .get('comment-page.error-comment-data')
        .subscribe((message) => {
          notificationService.show(message);
        });
      return false;
    }
    return true;
  }
}
