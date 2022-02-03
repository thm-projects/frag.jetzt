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

@Component({
  selector: 'app-topic-cloud-brainstorming',
  templateUrl: './topic-cloud-brainstorming.component.html',
  styleUrls: ['./topic-cloud-brainstorming.component.scss']
})
export class TopicCloudBrainstormingComponent implements OnInit, OnDestroy {

  @Input() target: string;
  @Input() userRole: UserRole;

  maxWordCountMin = 1;
  maxWordCountMax = 5;
  maxWordCount = new FormControl(1, [
    Validators.required, Validators.min(this.maxWordCountMin), Validators.max(this.maxWordCountMax),
  ]);
  maxWordLengthMin = 2;
  maxWordLengthMax = 30;
  maxWordLength = new FormControl(20, [
    Validators.required, Validators.min(this.maxWordLengthMin), Validators.max(this.maxWordLengthMax)
  ]);
  question = '';
  roomSubscription: Subscription;
  brainstormingData: BrainstormingSession;
  isLoading = true;
  isDeleting = false;
  isClosing = false;
  isCreating = false;
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
  ) {
  }

  cancelButtonActionCallback(): () => void {
    return () => this.dialogRef.close('abort');
  }

  openHelp() {
    const ref = this.dialog.open(ExplanationDialogComponent, {
      autoFocus: false
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
      this.translateService.get('content.brainstorming-direct-send-disabled')
        .subscribe(msg => this.notificationService.show(msg));
      return;
    }
    this.isCreating = true;
    this.brainstormingService.createSession({
      roomId: this._room.id,
      active: true,
      createdAt: new Date(),
      title: this.question,
      maxWordCount: this.maxWordCount.value,
      maxWordLength: this.maxWordLength.value
    }).subscribe({
      next: session => {
        this.isCreating = false;
        this._room.brainstormingSession = session;
        this.open();
      },
      error: _ => {
        this.isCreating = false;
        this.showSomethingWentWrong();
      }
    });
  }

  checkForEnter(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      this.openNew();
    }
  }

  ngOnInit(): void {
    this.sessionService.getRoomOnce().subscribe(room => {
      this._room = room;
      this.isLoading = false;
      this.brainstormingData = room.brainstormingSession;
      this.roomSubscription = this.sessionService.receiveRoomUpdates().subscribe(() => {
        this.brainstormingData = room.brainstormingSession;
      });
    });
  }

  ngOnDestroy() {
    this.roomSubscription?.unsubscribe();
  }

  canCreate() {
    return !this.brainstormingData?.active && this.question && this.maxWordCount.valid && this.maxWordLength.valid;
  }

  closeSession() {
    if (this.isClosing) {
      return;
    }
    this.isClosing = true;
    this.brainstormingService.closeSession(this.brainstormingData.id)
      .subscribe({
        next: _ => this.isClosing = false,
        error: () => {
          this.isClosing = false;
          this.showSomethingWentWrong();
        }
      });
  }

  deleteSession() {
    if (this.isDeleting) {
      return;
    }
    this.isDeleting = true;
    this.deleteOld().subscribe({
      next: _ => this.isDeleting = false,
      error: () => {
        this.isDeleting = false;
        this.showSomethingWentWrong();
      }
    });
  }

  private deleteOld() {
    return forkJoin([
      this.deleteOldBrainstormingQuestions(),
      this.brainstormingService.deleteSession(this._room.brainstormingSession.id)
    ]);
  }

  private deleteOldBrainstormingQuestions(): Observable<any> {
    if (!this.roomDataService.getCurrentRoomData()) {
      return of(null);
    }
    const toBeRemoved = this.roomDataService.getCurrentRoomData()
      .filter(comment => comment.brainstormingQuestion && comment.id)
      .concat(this.roomDataService.getCurrentRoomData(true).filter(c => c.brainstormingQuestion && c.id));
    if (toBeRemoved.length < 1) {
      return of(null);
    }
    return forkJoin(toBeRemoved.map(c => this.commentService.deleteComment(c.id)));
  }

  private showSomethingWentWrong() {
    this.translateService.get('content.brainstorming-action-went-wrong')
      .subscribe(msg => this.notificationService.show(msg));
  }

}
