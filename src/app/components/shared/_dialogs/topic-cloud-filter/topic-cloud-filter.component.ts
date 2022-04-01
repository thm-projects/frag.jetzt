import { Component, Inject, Input, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { NotificationService } from '../../../../services/util/notification.service';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../../services/util/language.service';
import { EventService } from '../../../../services/util/event.service';
import { Router } from '@angular/router';
import { RoomService } from '../../../../services/http/room.service';
import { Comment } from '../../../../models/comment';
import { TopicCloudAdminService } from '../../../../services/util/topic-cloud-admin.service';
import { TopicCloudAdminData } from '../topic-cloud-administration/TopicCloudAdminData';
import { TagCloudDataService } from '../../../../services/util/tag-cloud-data.service';
import { WorkerDialogComponent } from '../worker-dialog/worker-dialog.component';
import { Room } from '../../../../models/room';
import { ExplanationDialogComponent } from '../explanation-dialog/explanation-dialog.component';
import { UserRole } from '../../../../models/user-roles.enum';
import { RoomDataService } from '../../../../services/util/room-data.service';
import { Subscription } from 'rxjs';
import { SessionService } from '../../../../services/util/session.service';
import { Period, RoomDataFilter } from '../../../../utils/data-filter-object.lib';
import { DataFilterObject } from '../../../../utils/data-filter-object';
import { AuthenticationService } from '../../../../services/http/authentication.service';

class CommentsCount {
  comments: number;
  users: number;
  keywords: number;
}

@Component({
  selector: 'app-topic-cloud-filter',
  templateUrl: './topic-cloud-filter.component.html',
  styleUrls: ['./topic-cloud-filter.component.scss']
})
export class TopicCloudFilterComponent implements OnInit, OnDestroy {
  @Input() target: string;
  @Input() userRole: UserRole;

  continueFilter = 'continueWithAll';
  allComments: CommentsCount;
  filteredComments: CommentsCount;
  disableCurrentFiltersOptions = false;
  isTopicRequirementActive = false;
  hasNoKeywords = false;
  private readonly _adminData: TopicCloudAdminData;
  private _subscriptionCommentUpdates: Subscription;

  constructor(
    public dialogRef: MatDialogRef<TopicCloudFilterComponent>,
    public dialog: MatDialog,
    public notificationService: NotificationService,
    public translationService: TranslateService,
    protected langService: LanguageService,
    private router: Router,
    protected roomService: RoomService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public eventService: EventService,
    private sessionService: SessionService,
    private topicCloudAdminService: TopicCloudAdminService,
    private roomDataService: RoomDataService,
    private authenticationService: AuthenticationService,
  ) {
    langService.getLanguage().subscribe(lang => translationService.use(lang));
    this._adminData = TopicCloudAdminService.getDefaultAdminData;
    this.isTopicRequirementActive = !TopicCloudAdminService.isTopicRequirementDisabled(this._adminData);
  }

  public static isUpdatable(comments: Comment[], userRole: UserRole, roomId: string): boolean {
    const data = localStorage.getItem('commentListKeywordGen');
    const set = new Set<string>(data ? JSON.parse(data) : []);
    let count = 0;
    let newCount = 0;
    comments.forEach(comment => {
      if (comment.keywordsFromSpacy && comment.keywordsFromSpacy.length) {
        newCount++;
      } else {
        count++;
      }
    });
    if (newCount + count < 1) {
      return false;
    }
    if (userRole === UserRole.PARTICIPANT) {
      return newCount < 1 && !set.has(roomId) && !WorkerDialogComponent.isWorkingOnRoom(roomId);
    }
    if (count * 2 / 3 < newCount) {
      return false;
    }
    return !WorkerDialogComponent.isWorkingOnRoom(roomId);
  }

  public static startUpdate(dialog: MatDialog, room: Room, userRole: UserRole) {
    const data = localStorage.getItem('commentListKeywordGen');
    const set = new Set<string>(data ? JSON.parse(data) : []);
    if (userRole === UserRole.PARTICIPANT && set.has(room.id)) {
      return;
    }
    WorkerDialogComponent.addWorkTask(dialog, room);
    if (userRole === UserRole.PARTICIPANT) {
      localStorage.setItem('commentListKeywordGen', JSON.stringify([...set, room.id]));
    }
  }

  ngOnInit() {
    this.commentsLoadedCallback(true);
    this._subscriptionCommentUpdates = this.roomDataService.receiveUpdates([{ finished: true }])
      .subscribe(_ => this.commentsLoadedCallback());
  }

  ngOnDestroy() {
    if (this._subscriptionCommentUpdates) {
      this._subscriptionCommentUpdates.unsubscribe();
    }
  }

  commentsLoadedCallback(isNew = false) {
    const room = this.sessionService.currentRoom;
    const blacklist = room.blacklist ? JSON.parse(room.blacklist) : [];
    const currentComments = this.data.filterObject.currentData.comments;
    const mods = new Set<string>(this.sessionService.currentModerators.map(m => m.accountId));
    DataFilterObject.filterOnce(new RoomDataFilter(null), this.roomDataService,
      this.authenticationService, this.sessionService).subscribe(result => {
      this.allComments = this.getCommentCounts(result.comments, blacklist, room.blacklistActive, room.ownerId, mods);
    });
    this.filteredComments = this.getCommentCounts(currentComments, blacklist, room.blacklistActive, room.ownerId, mods);
    if (isNew) {
      this.hasNoKeywords = TopicCloudFilterComponent.isUpdatable(this.roomDataService.getCurrentRoomData(false),
        this.userRole, room.id);
    }
    this.disableCurrentFiltersOptions = ((this.allComments.comments === this.filteredComments.comments) &&
      (this.allComments.users === this.filteredComments.users) &&
      (this.allComments.keywords === this.filteredComments.keywords));
    if (this.disableCurrentFiltersOptions) {
      this.continueFilter = 'continueWithAll';
    }
    if (this.filteredComments.comments === 0 && this.allComments.comments === 0) {
      if (this.userRole > UserRole.PARTICIPANT) {
        setTimeout(() => {
          this.continueFilter = 'continueWithAllFromNow';
        });
      } else {
        setTimeout(() => {
          this.continueFilter = 'continueWithAllFromNow';
          this.confirmButtonActionCallback()();
        });
      }
    }
  }

  isMobile(): boolean {
    return window.matchMedia('(max-width:500px)').matches;
  }

  onKeywordRefreshClick() {
    this.hasNoKeywords = false;
    TopicCloudFilterComponent.startUpdate(this.dialog, this.sessionService.currentRoom, this.userRole);
  }

  getCommentCounts(comments: Comment[], blacklist: string[], blacklistEnabled: boolean, ownerId: string, mods: Set<string>): CommentsCount {
    const [data, users] = TagCloudDataService.buildDataFromComments(ownerId, mods,
      blacklist, blacklistEnabled, this._adminData, this.roomDataService, comments, false);
    const counts = new CommentsCount();
    counts.comments = comments.length;
    counts.users = users.size;
    counts.keywords = data.size;
    return counts;
  }

  cancelButtonActionCallback(): () => void {
    return () => this.dialogRef.close('abort');
  }

  confirmButtonActionCallback() {
    return () => {
      let filter = new RoomDataFilter(null);
      filter.lastRoomId = this.sessionService.currentRoom?.id;
      switch (this.continueFilter) {
        case 'continueWithAll':
          // all questions allowed
          break;
        case 'continueWithAllFromNow':
          filter.period = Period.FromNow;
          filter.fromNow = new Date().getTime();
          break;
        case 'continueWithCurr':
          const roomId = filter.lastRoomId;
          filter = this.data.filterObject.filter;
          filter.lastRoomId = roomId;
          break;
        default:
          return;
      }

      filter.save('tagCloud');
      this.dialogRef.close();
      this.router.navigateByUrl(this.target);
    };
  }

  checkForEnter(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      this.confirmButtonActionCallback()();
    }
  }

  openHelp() {
    const ref = this.dialog.open(ExplanationDialogComponent, {
      autoFocus: false
    });
    ref.componentInstance.translateKey = 'explanation.topic-cloud';
  }

}
