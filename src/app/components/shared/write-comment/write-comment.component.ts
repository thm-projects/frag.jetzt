import {
  AfterViewInit,
  Component,
  Injector,
  Input,
  OnInit,
  TemplateRef,
  signal,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  Language,
  LanguagetoolService,
} from '../../../services/http/languagetool.service';
import { Comment } from '../../../models/comment';
import { NotificationService } from '../../../services/util/notification.service';
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
import {
  ROOM_ROLE_MAPPER,
  RoomStateService,
} from 'app/services/state/room-state.service';
import { dataService } from 'app/base/db/data-service';
import { user$ } from 'app/user/state/user';
import rawI18n from './i18n.json';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
const i18n = I18nLoader.load(rawI18n);

@Component({
  selector: 'app-write-comment',
  templateUrl: './write-comment.component.html',
  styleUrls: ['./write-comment.component.scss'],
  standalone: false,
})
export class WriteCommentComponent implements OnInit, AfterViewInit {
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
  protected readonly i18n = i18n;
  data = signal('');
  isSubmittingComment = false;
  selectedTag: string;
  maxTextCharacters = 7500;
  maxDataCharacters = 7500;
  // Grammarheck
  selectedLang: Language = 'auto';
  brainstormingInfo: string;
  userRole: UserRole;
  user: User;
  readonly questionerNameMin = 2;
  readonly questionerNameMax = 30;
  questionerNameFormControl = new FormControl('', [
    Validators.minLength(this.questionerNameMin),
    Validators.maxLength(this.questionerNameMax),
  ]);
  private _keywordExtractor: KeywordExtractor;
  private _currentData: ForumComment;

  constructor(
    private notification: NotificationService,
    private translateService: TranslateService,
    public languagetoolService: LanguagetoolService,
    private sessionService: SessionService,
    private accountState: AccountStateService,
    private roomState: RoomStateService,
    injector: Injector,
  ) {
    this._keywordExtractor = new KeywordExtractor(injector);
  }

  private roleIconMap = {
    guest: 'person_outline',
    participant: 'person',
    moderator: 'support_agent',
    creator: 'co_present',
    admin: 'admin_panel_settings',
  };

  getRoleIcon(): string {
    switch (this.userRole) {
      case UserRole.EDITING_MODERATOR:
        return this.roleIconMap.moderator;
      case UserRole.PARTICIPANT:
        return this.roleIconMap.participant;
      case UserRole.EXECUTIVE_MODERATOR:
        return this.roleIconMap.moderator;
      case UserRole.CREATOR:
        return this.roleIconMap.creator;

      default:
        return 'manage_accounts'; // Standard-Icon, falls keine Rolle zugewiesen ist
    }
  }

  ngOnInit(): void {
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
      this.maxTextCharacters = 7500;
    } else {
      this.maxTextCharacters = this.isModerator ? 25000 : 7500;
    }
    this.userRole = ROOM_ROLE_MAPPER[this.roomState.getCurrentAssignedRole()];
    this.maxDataCharacters = this.isModerator
      ? this.maxTextCharacters * 5
      : this.maxTextCharacters * 3;
    user$.subscribe((user) => (this.user = user));
    if (this.rewriteCommentData) {
      this.questionerNameFormControl.setValue(
        this.rewriteCommentData?.questionerName,
      );
    } else {
      forkJoin([this.sessionService.getRoomOnce(), user$.pipe(take(1))])
        .pipe(
          switchMap(([room, user]) =>
            dataService.localRoomSetting.get([room.id, user.id]),
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

  onTextChange(text: string) {
    this.data.set(text);
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

  protected createComment() {
    if (this.data().length > this.maxTextCharacters) {
      this.notification.show(i18n().warning);
      return;
    }

    const options: CommentCreateOptions = {
      userId: this.user.id,
      brainstormingSessionId: this.brainstormingData?.id || null,
      brainstormingLanguage: this.brainstormingData?.language || 'en',
      body: this.data(),
      tag: this.selectedTag,
      questionerName: this.questionerNameFormControl.value,
      callbackFinished: () => (this.isSubmittingComment = false),
      isModerator: this.userRole > 0,
      hadUsedDeepL: false, // TODO
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
