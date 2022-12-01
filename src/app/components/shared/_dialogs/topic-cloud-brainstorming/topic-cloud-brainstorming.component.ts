import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { UserRole } from '../../../../models/user-roles.enum';
import { DeviceInfoService } from '../../../../services/util/device-info.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SessionService } from '../../../../services/util/session.service';
import { forkJoin, Observable, of, Subscription } from 'rxjs';
import { Room } from '../../../../models/room';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService } from '../../../../services/util/notification.service';
import { RoomDataService } from '../../../../services/util/room-data.service';
import { CommentService } from '../../../../services/http/comment.service';
import { ExplanationDialogComponent } from '../explanation-dialog/explanation-dialog.component';
import { BrainstormingService } from '../../../../services/http/brainstorming.service';
import { BrainstormingSession } from '../../../../models/brainstorming-session';
import { AVAILABLE_LANGUAGES, LanguageService } from 'app/services/util/language.service';

@Component({
  selector: 'app-topic-cloud-brainstorming',
  templateUrl: './topic-cloud-brainstorming.component.html',
  styleUrls: ['./topic-cloud-brainstorming.component.scss'],
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
  brainstormingDuration = 5;
  brainstormingAllowIdeas = false;
  brainstormingAllowRating = false;
  roomSubscription: Subscription;
  brainstormingData: BrainstormingSession;
  isLoading = true;
  isDeleting = false;
  isClosing = false;
  isCreating = false;
  readonly languages = [...AVAILABLE_LANGUAGES];
  language: FormControl;
  private _room: Room;

  constructor(
    public deviceInfo: DeviceInfoService,
    private dialogRef: MatDialogRef<TopicCloudBrainstormingComponent>,
    private dialog: MatDialog,
    private sessionService: SessionService,
    private roomDataService: RoomDataService,
    private commentService: CommentService,
    private translateService: TranslateService,
    private notificationService: NotificationService,
    private router: Router,
    private brainstormingService: BrainstormingService,
    private languageService: LanguageService,
  ) {
    this.language = new FormControl(languageService.currentLanguage() || this.languages[0], [
      Validators.required,
    ]);
  }

  cancelButtonActionCallback(): () => void {
    return () => this.dialogRef.close('abort');
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
      this.translateService
        .get('content.brainstorming-direct-send-disabled')
        .subscribe((msg) => this.notificationService.show(msg));
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
        error: (_) => {
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
      this.roomSubscription = this.sessionService
        .receiveRoomUpdates()
        .subscribe(() => {
          this.brainstormingData = room.brainstormingSession;
        });
    });
  }

  displayMin(v) {
    return v + 'min';
  }

  ngOnDestroy() {
    this.roomSubscription?.unsubscribe();
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
        next: (_) => (this.isClosing = false),
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
      next: (_) => (this.isDeleting = false),
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

  private deleteOldBrainstormingQuestions(): Observable<any> {
    const comments = this.roomDataService.dataAccessor.currentRawComments();
    if (!comments) {
      return of(null);
    }
    const sessionId = this._room.brainstormingSession.id;
    const toBeRemoved = comments
      .filter(
        (comment) => comment.brainstormingSessionId === sessionId && comment.id,
      )
      .concat(
        (
          this.roomDataService.moderatorDataAccessor.currentRawComments() ?? []
        ).filter((c) => c.brainstormingSessionId === sessionId && c.id),
      );
    if (toBeRemoved.length < 1) {
      return of(null);
    }
    return forkJoin(
      toBeRemoved.map((c) => this.commentService.deleteComment(c.id)),
    );
  }

  private showSomethingWentWrong() {
    this.translateService
      .get('content.brainstorming-action-went-wrong')
      .subscribe((msg) => this.notificationService.show(msg));
  }
}
