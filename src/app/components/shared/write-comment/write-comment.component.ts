import {
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  Language,
  LanguagetoolResult,
  LanguagetoolService,
} from '../../../services/http/languagetool.service';
import { Comment } from '../../../models/comment';
import { NotificationService } from '../../../services/util/notification.service';
import { ViewCommentDataComponent } from '../view-comment-data/view-comment-data.component';
import {
  DeepLService,
  FormalityType,
  SourceLang,
  TargetLang,
} from '../../../services/http/deep-l.service';
import {
  DeepLDialogComponent,
  ResultValue,
} from '../_dialogs/deep-ldialog/deep-ldialog.component';
import { MatDialog } from '@angular/material/dialog';
import { FormControl, Validators } from '@angular/forms';
import { BrainstormingSession } from '../../../models/brainstorming-session';
import { SharedTextFormatting } from '../../../utils/shared-text-formatting';
import { UserRole } from '../../../models/user-roles.enum';
import { SessionService } from '../../../services/util/session.service';
import { User } from '../../../models/user';
import { StandardDelta } from '../../../utils/quill-utils';
import { KeywordExtractor } from '../../../utils/keyword-extractor';
import { RoomDataService } from '../../../services/util/room-data.service';
import { SpacyService } from '../../../services/http/spacy.service';
import { ForumComment } from '../../../utils/data-accessor';
import { UserManagementService } from '../../../services/util/user-management.service';
import { DBLocalRoomSettingsService } from 'app/services/persistence/dblocal-room-settings.service';
import { forkJoin, of, switchMap, take } from 'rxjs';

@Component({
  selector: 'app-write-comment',
  templateUrl: './write-comment.component.html',
  styleUrls: ['./write-comment.component.scss'],
})
export class WriteCommentComponent implements OnInit, OnDestroy {
  @ViewChild(ViewCommentDataComponent) commentData: ViewCommentDataComponent;
  @ViewChild('mobileMock') mobileMock: ElementRef<HTMLDivElement>;
  @Input() isModerator = false;
  @Input() tags: string[];
  @Input() onClose: (comment?: Comment) => any;
  @Input() disableCancelButton = false;
  @Input() confirmLabel = 'save';
  @Input() cancelLabel = 'cancel';
  @Input() additionalTemplate: TemplateRef<any>;
  @Input() enabled = true;
  @Input() isCommentAnswer = false;
  @Input() placeholder = 'comment-page.enter-comment';
  @Input() i18nSection = 'comment-page';
  @Input() isQuestionerNameEnabled = false;
  @Input() brainstormingData: BrainstormingSession;
  @Input() allowEmpty = false;
  @Input() additionalMockOffset: number = 0;
  @Input() commentReference: string = null;
  @Input() onlyText = false;
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
  private _keywordExtractor: KeywordExtractor;
  private _currentData: ForumComment;

  constructor(
    private notification: NotificationService,
    private translateService: TranslateService,
    public languagetoolService: LanguagetoolService,
    private deeplService: DeepLService,
    private dialog: MatDialog,
    private sessionService: SessionService,
    private userManagementService: UserManagementService,
    private roomDataService: RoomDataService,
    private spacyService: SpacyService,
    private dBLocalRoomSettingsService: DBLocalRoomSettingsService,
  ) {
    this._keywordExtractor = new KeywordExtractor(
      dialog,
      translateService,
      notification,
      roomDataService,
      languagetoolService,
      spacyService,
      deeplService,
    );
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
    this._mockMatcher.addEventListener('change', (e) => {
      this._mobileMockPossible = e.matches;
      if (!this._mobileMockPossible) {
        this._mobileMockActive = false;
      }
    });
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
    this.userRole = this.sessionService.currentRole;
    this.maxDataCharacters = this.isModerator
      ? this.maxTextCharacters * 5
      : this.maxTextCharacters * 3;
    this.userManagementService
      .getUser()
      .subscribe((user) => (this.user = user));
    forkJoin([
      this.sessionService.getRoomOnce(),
      this.userManagementService.getUser().pipe(take(1)),
    ])
      .pipe(
        switchMap(([room, user]) =>
          this.dBLocalRoomSettingsService.getSettings(room.id, user.id),
        ),
      )
      .subscribe((data) => {
        this.questionerNameFormControl.setValue(data?.pseudonym ?? '');
      });
  }

  ngOnDestroy() {
    this._mockMatcher.removeAllListeners();
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
    this.grammarCheck(this.commentData.currentText);
  }

  grammarCheck(rawText: string): void {
    this.isSpellchecking = true;
    this.hasSpellcheckConfidence = true;
    this.checkSpellings(rawText).subscribe({
      next: (wordsCheck) => {
        if (!this.checkLanguageConfidence(wordsCheck)) {
          this.hasSpellcheckConfidence = false;
          this.isSpellchecking = false;
          return;
        }
        if (wordsCheck.language.name.includes('German')) {
          this.selectedLang = 'de-DE';
        } else if (wordsCheck.language.name.includes('English')) {
          this.selectedLang = 'en-US';
        } else if (wordsCheck.language.name.includes('French')) {
          this.selectedLang = 'fr';
        } else {
          this.selectedLang = 'auto';
        }
        const previous = this.commentData.currentData;
        this.openDeeplDialog(
          previous,
          rawText,
          wordsCheck,
          (selected, submitted) => {
            if (selected.view === this.commentData) {
              this._hadUsedDeepl = false;
              if (wordsCheck.matches.length === 0) {
                this.translateService
                  .get('deepl.no-optimization')
                  .subscribe((msg) => this.notification.show(msg));
              } else {
                this.commentData.buildMarks(rawText, wordsCheck);
              }
            } else {
              this._hadUsedDeepl = true;
              this.commentData.currentData = selected.body;
              this.commentData.copyMarks(selected.view);
            }
            if (submitted) {
              this.createComment();
            }
          },
        );
      },
      error: () => {
        this.isSpellchecking = false;
      },
    });
  }

  checkLanguageConfidence(wordsCheck: any) {
    return this.selectedLang === 'auto'
      ? wordsCheck.language.detectedLanguage.confidence >= 0.5
      : true;
  }

  isSpellcheckingButtonDisabled(): boolean {
    if (!this.commentData) {
      return true;
    }
    const text = this.commentData.currentText;
    return text.length < 5 || text.trim().split(/\s+/, 4).length < 4;
  }

  checkSpellings(text: string, language: Language = this.selectedLang) {
    return this.languagetoolService.checkSpellings(text, language);
  }

  getContent(): ForumComment {
    const data = this.commentData.currentData;
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
    let allowed = true;
    const data = this.commentData.currentData;
    const text = this.commentData.currentText;
    if (this.isQuestionerNameEnabled) {
      this.questionerNameFormControl.setValue(
        (this.questionerNameFormControl.value || '').trim(),
      );
      allowed =
        !this.questionerNameFormControl.hasError('minlength') &&
        !this.questionerNameFormControl.hasError('maxlength');
    }
    if (
      this.brainstormingData &&
      SharedTextFormatting.getWords(text).length >
        this.brainstormingData.maxWordCount
    ) {
      this.translateService
        .get('comment-page.error-comment-brainstorming', this.brainstormingData)
        .subscribe((msg) => this.notification.show(msg));
      allowed = false;
    }
    if (
      this.allowEmpty ||
      (ViewCommentDataComponent.checkInputData(
        data,
        text,
        this.translateService,
        this.notification,
        this.maxTextCharacters,
        this.maxDataCharacters,
      ) &&
        allowed)
    ) {
      const realData = this.allowEmpty && text.length < 2 ? { ops: [] } : data;
      const options = {
        userId: this.user.id,
        isBrainstorming: !!this.brainstormingData,
        body: realData,
        tag: this.selectedTag,
        questionerName: this.questionerNameFormControl.value,
        callbackFinished: () => (this.isSubmittingComment = false),
        isModerator: this.userRole > 0,
        hadUsedDeepL: this._hadUsedDeepl,
        selectedLanguage: this.selectedLang,
        commentReference: this.commentReference,
      };
      if (this.onlyText) {
        this.onClose(this._keywordExtractor.createPlainComment(options));
        return;
      }
      this.isSubmittingComment = true;
      this._keywordExtractor.createCommentInteractive(options).subscribe({
        next: (comment) => {
          localStorage.setItem('comment-created', String(true));
          this.onClose(comment);
        },
        error: () => {
          // Ignore
        },
      });
    }
  }

  private openDeeplDialog(
    body: StandardDelta,
    text: string,
    result: LanguagetoolResult,
    onClose: (selected: ResultValue, submitted?: boolean) => void,
  ) {
    let target = TargetLang.EN_US;
    const code = result.language.detectedLanguage.code
      .toUpperCase()
      .split('-')[0];
    const source = code in SourceLang ? SourceLang[code] : null;
    if (code.startsWith(SourceLang.EN)) {
      target = TargetLang.DE;
    }
    this.dBLocalRoomSettingsService
      .getSettings(this.sessionService.currentRoom?.id, this.user?.id)
      .pipe(
        switchMap((data) => {
          const formality = data.formality ?? FormalityType.Less;
          return forkJoin([
            this.deeplService.improveDelta(body, target, formality),
            of(formality),
          ]);
        }),
      )
      .subscribe({
        next: ([[improvedBody, improvedText], formality]) => {
          this.isSpellchecking = false;
          if (improvedText.replace(/\s+/g, '') === text.replace(/\s+/g, '')) {
            this.translateService
              .get('deepl.no-optimization')
              .subscribe((msg) => this.notification.show(msg));
            onClose({ body, text, view: this.commentData });
            return;
          }
          const instance = this.dialog.open(DeepLDialogComponent, {
            width: '900px',
            maxWidth: '100%',
            data: {
              body,
              text,
              improvedBody,
              improvedText,
              maxTextCharacters: this.maxTextCharacters,
              maxDataCharacters: this.maxDataCharacters,
              isModerator: this.isModerator,
              result,
              onClose,
              target: DeepLService.transformSourceToTarget(source),
              usedTarget: target,
              formality,
            },
          });
          instance.afterClosed().subscribe((val) => {
            if (!val) {
              onClose({ body, text, view: this.commentData });
            }
          });
        },
        error: () => {
          this.isSpellchecking = false;
          onClose({ body, text, view: this.commentData });
        },
      });
  }
}
