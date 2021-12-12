import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { UserRole } from '../../../../models/user-roles.enum';
import { DeviceInfoService } from '../../../../services/util/device-info.service';
import { MatDialogRef } from '@angular/material/dialog';
import { FormControl, Validators } from '@angular/forms';
import { EventService } from '../../../../services/util/event.service';
import { Router } from '@angular/router';
import { SessionService } from '../../../../services/util/session.service';
import { forkJoin, Observable, of, Subscription } from 'rxjs';
import { TagCloudSettings } from '../../../../utils/TagCloudSettings';
import { Room } from '../../../../models/room';
import { RoomService } from '../../../../services/http/room.service';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService } from '../../../../services/util/notification.service';
import { RoomDataService } from '../../../../services/util/room-data.service';
import { CommentService } from '../../../../services/http/comment.service';

export interface BrainstormingSettings {
  active: boolean;
  /** as DateTime */
  started: number;
  question: string;
  maxWordLength: number;
  maxWordCount: number;
}

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
  brainstormingData: BrainstormingSettings;
  isLoading = true;
  isDeleting = false;
  isClosing = false;
  isCreating = false;
  private _room: Room;

  constructor(
    public deviceInfo: DeviceInfoService,
    private dialogRef: MatDialogRef<TopicCloudBrainstormingComponent>,
    private eventService: EventService,
    private sessionService: SessionService,
    private roomService: RoomService,
    private roomDataService: RoomDataService,
    private commentService: CommentService,
    private translateService: TranslateService,
    private notificationService: NotificationService,
    private router: Router,
  ) {
  }

  cancelButtonActionCallback(): () => void {
    return () => this.dialogRef.close('abort');
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
    this.isCreating = true;
    TagCloudSettings.getDefault({
      active: true,
      started: new Date().getTime(),
      question: this.question,
      maxWordCount: this.maxWordCount.value,
      maxWordLength: this.maxWordLength.value
    }).applyToRoom(this._room);
    this.roomService.updateRoom(this._room)
      .subscribe(() => {
        this.isCreating = false;
        this.open();
      }, () => {
        this.isCreating = false;
        this.showSomethingWentWrong();
      });
    this.deleteOldBrainstormingQuestions().subscribe();
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
      this.brainstormingData = TagCloudSettings.getFromRoom(room)?.brainstorming;
      this.roomSubscription = this.sessionService.receiveRoomUpdates().subscribe(() => {
        this.brainstormingData = TagCloudSettings.getFromRoom(room)?.brainstorming;
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
    TagCloudSettings.getDefault({
      ...this.brainstormingData,
      active: false
    }).applyToRoom(this._room);
    this.roomService.updateRoom(this._room)
      .subscribe(() => this.isClosing = false, () => {
        this.isClosing = false;
        this.showSomethingWentWrong();
      });
  }

  deleteSession() {
    if (this.isDeleting) {
      return;
    }
    this.isDeleting = true;
    TagCloudSettings.getDefault().applyToRoom(this._room);
    this.roomService.updateRoom(this._room)
      .subscribe(() => this.isDeleting = false, () => {
        this.isDeleting = false;
        this.showSomethingWentWrong();
      });
    this.deleteOldBrainstormingQuestions().subscribe();
  }

  getTranslate() {
    return {
      maxWordCount: this.brainstormingData?.maxWordCount,
      maxWordLength: this.brainstormingData?.maxWordLength,
      question: this.brainstormingData?.question
    };
  }

  private deleteOldBrainstormingQuestions(): Observable<any> {
    if (!this.roomDataService.currentRoomData) {
      return of(null);
    }
    const toBeRemoved = this.roomDataService.currentRoomData
      .filter(comment => comment.brainstormingQuestion && comment.id);
    return forkJoin(toBeRemoved.map(c => this.commentService.deleteComment(c.id)));
  }

  private showSomethingWentWrong() {
    this.translateService.get('content.brainstorming-action-went-wrong')
      .subscribe(msg => this.notificationService.show(msg));
  }

}
