import rawI18n from './i18n.json';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
const i18n = I18nLoader.load(rawI18n);
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { UserRole } from '../../../../models/user-roles.enum';
import { FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SessionService } from '../../../../services/util/session.service';
import { forkJoin, Observable, of, ReplaySubject, takeUntil } from 'rxjs';
import { Room } from '../../../../models/room';
import { NotificationService } from '../../../../services/util/notification.service';
import { CommentService } from '../../../../services/http/comment.service';
import { ExplanationDialogComponent } from '../../../../components/shared/_dialogs/explanation-dialog/explanation-dialog.component';
import { BrainstormingService } from '../../../../services/http/brainstorming.service';
import { BrainstormingSession } from '../../../../models/brainstorming-session';
import { AppStateService } from 'app/services/state/app-state.service';
import { DeviceStateService } from 'app/services/state/device-state.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AVAILABLE_LANGUAGES } from 'app/base/language/language';
import {
  uiComments,
  uiModeratedComments,
} from 'app/room/state/comment-updates';

@Component({
  selector: 'app-topic-cloud-brainstorming',
  templateUrl: './topic-cloud-brainstorming.component.html',
  styleUrls: ['./topic-cloud-brainstorming.component.scss'],
  standalone: false,
})
export class TopicCloudBrainstormingComponent implements OnInit, OnDestroy {
  @Input() target: string;
  @Input() userRole: UserRole;

  maxWordCountMin = 1;
  maxWordCountMax = 5;
  maxWordCount = new FormControl(1, [
    Validators.required,
    Validators.min(this.maxWordCountMin),
    Validators.max(this.maxWordCountMax),
  ]);
  maxWordLengthMin = 2;
  maxWordLengthMax = 30;
  maxWordLength = new FormControl(20, [
    Validators.required,
    Validators.min(this.maxWordLengthMin),
    Validators.max(this.maxWordLengthMax),
  ]);
  question = '';
  brainstormingDuration = 15;
  brainstormingAllowIdeas = true;
  brainstormingAllowRating = true;
  brainstormingData: BrainstormingSession;
  isLoading = true;
  isDeleting = false;
  isClosing = false;
  isCreating = false;
  readonly languages = [...AVAILABLE_LANGUAGES];
  language: FormControl;
  isMobile = false;
  protected readonly i18n = i18n;
  private _room: Room;
  private destroyer = new ReplaySubject(1);

  constructor(
    private dialogRef: MatDialogRef<TopicCloudBrainstormingComponent>,
    private dialog: MatDialog,
    private sessionService: SessionService,
    private commentService: CommentService,
    private notificationService: NotificationService,
    private router: Router,
    private brainstormingService: BrainstormingService,
    appState: AppStateService,
    deviceState: DeviceStateService,
  ) {
    this.language = new FormControl(
      appState.getCurrentLanguage() || this.languages[0],
      [Validators.required],
    );
    deviceState.mobile$
      .pipe(takeUntil(this.destroyer))
      .subscribe((m) => (this.isMobile = m));
  }

  openHelp() {
    const ref = this.dialog.open(ExplanationDialogComponent, {
      autoFocus: false,
    });
    ref.componentInstance.translateKey = 'explanation.brainstorming';
  }

  open() {
    this.dialogRef.close();
    this.router.navigateByUrl(this.target);
  }

  openNew() {
    if (!this.canCreate()) {
      return;
    }
    if (this.isCreating) {
      return;
    }
    if (!this._room.directSend) {
      this.notificationService.show(i18n().moderationEnabled);
      return;
    }
    this.isCreating = true;
    this.brainstormingService
      .createSession({
        roomId: this._room.id,
        title: this.question,
        maxWordCount: this.maxWordCount.value,
        maxWordLength: this.maxWordLength.value,
        language: this.language.value,
        ideasEndTimestamp: null,
        ideasTimeDuration: this.brainstormingDuration,
        ratingAllowed: this.brainstormingAllowRating,
        ideasFrozen: !this.brainstormingAllowIdeas,
      })
      .subscribe({
        next: (session) => {
          this.isCreating = false;
          this._room.brainstormingSession = new BrainstormingSession(session);
          this.open();
        },
        error: () => {
          this.isCreating = false;
          this.showSomethingWentWrong();
        },
      });
  }

  getDuration(): string {
    return this.brainstormingDuration.toString().padStart(2, '0');
  }

  checkForEnter(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      this.openNew();
    }
  }

  ngOnInit(): void {
    this.sessionService.getRoomOnce().subscribe((room) => {
      this._room = room;
      this.isLoading = false;
      this.brainstormingData = room.brainstormingSession;
      this.sessionService
        .receiveRoomUpdates()
        .pipe(takeUntil(this.destroyer))
        .subscribe(() => {
          this.brainstormingData = room.brainstormingSession;
        });
    });
  }

  displayMin(v) {
    return v + 'min';
  }

  ngOnDestroy() {
    this.destroyer.next(true);
    this.destroyer.complete();
  }

  canCreate() {
    return (
      !this.brainstormingData &&
      this.question &&
      this.maxWordCount.valid &&
      this.maxWordLength.valid
    );
  }

  closeSession() {
    if (this.isClosing) {
      return;
    }
    this.isClosing = true;
    this.brainstormingService
      .patchSession(this.brainstormingData.id, { active: false })
      .subscribe({
        next: () => (this.isClosing = false),
        error: () => {
          this.isClosing = false;
          this.showSomethingWentWrong();
        },
      });
  }

  deleteSession() {
    if (this.isDeleting) {
      return;
    }
    this.isDeleting = true;
    this.deleteOld().subscribe({
      next: () => (this.isDeleting = false),
      error: () => {
        this.isDeleting = false;
        this.showSomethingWentWrong();
      },
    });
  }

  private deleteOld() {
    return forkJoin([
      this.deleteOldBrainstormingQuestions(),
      this.brainstormingService.deleteSession(
        this._room.brainstormingSession.id,
      ),
    ]);
  }

  private deleteOldBrainstormingQuestions(): Observable<unknown> {
    const comments = uiComments().rawComments.map((e) => e.comment);
    if (!comments) {
      return of(null);
    }
    const sessionId = this._room.brainstormingSession.id;
    const toBeRemoved = comments
      .filter(
        (comment) => comment.brainstormingSessionId === sessionId && comment.id,
      )
      .concat(
        (uiModeratedComments()?.rawComments.map((e) => e.comment) ?? []).filter(
          (c) => c.brainstormingSessionId === sessionId && c.id,
        ),
      );
    if (toBeRemoved.length < 1) {
      return of(null);
    }
    return forkJoin(
      toBeRemoved.map((c) => this.commentService.deleteComment(c.id)),
    );
  }

  private showSomethingWentWrong() {
    this.notificationService.show(i18n().global.changesGoneWrong);
  }
}
