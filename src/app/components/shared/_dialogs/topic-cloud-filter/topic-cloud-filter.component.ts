import { Component, Inject, Input, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { NotificationService } from '../../../../services/util/notification.service';
import { TranslateService } from '@ngx-translate/core';
import { RoomCreatorPageComponent } from '../../../creator/room-creator-page/room-creator-page.component';
import { LanguageService } from '../../../../services/util/language.service';
import { EventService } from '../../../../services/util/event.service';
import { Router } from '@angular/router';
import { RoomService } from '../../../../services/http/room.service';
import { Comment } from '../../../../models/comment';
import { CommentListData } from '../../comment-list/comment-list.component';
import { TopicCloudAdminService } from '../../../../services/util/topic-cloud-admin.service';
import { TopicCloudAdminData } from '../topic-cloud-administration/TopicCloudAdminData';
import { TagCloudDataService } from '../../../../services/util/tag-cloud-data.service';
import { WorkerDialogComponent } from '../worker-dialog/worker-dialog.component';
import { Room } from '../../../../models/room';
import { ThemeService } from '../../../../../theme/theme.service';
import { Theme } from '../../../../../theme/Theme';
import { ExplanationDialogComponent } from '../explanation-dialog/explanation-dialog.component';
import { ModeratorService } from '../../../../services/http/moderator.service';
import { UserRole } from '../../../../models/user-roles.enum';
import { RoomDataService } from '../../../../services/util/room-data.service';
import { Subscription } from 'rxjs';
import { CommentListFilter, Period } from '../../comment-list/comment-list.filter';
import { FormControl, Validators } from '@angular/forms';

class CommentsCount {
  comments: number;
  users: number;
  keywords: number;
}

enum KeywordsSource {
  fromUser = 'fromUser',
  fromSpacy = 'fromSpacy',
  all = 'all'
}

@Component({
  selector: 'app-topic-cloud-filter',
  templateUrl: './topic-cloud-filter.component.html',
  styleUrls: ['./topic-cloud-filter.component.scss']
})
export class TopicCloudFilterComponent implements OnInit, OnDestroy {
  @Input() target: string;
  @Input() userRole: UserRole;

  maxWordCountMin = 1;
  maxWordCountMax = 5;
  maxWordCount = new FormControl(1, [
    Validators.required, Validators.min(this.maxWordCountMin), Validators.max(this.maxWordCountMax),
  ]);
  maxWordLengthMin = 3;
  maxWordLengthMax = 30;
  maxWordLength = new FormControl(12, [
    Validators.required, Validators.min(this.maxWordLengthMin), Validators.max(this.maxWordLengthMax)
  ]);
  question = '';
  continueFilter = 'continueWithAll';
  comments: Comment[];
  tmpFilter: CommentListFilter;
  allComments: CommentsCount;
  filteredComments: CommentsCount;
  disableCurrentFiltersOptions = false;
  isTopicRequirementActive = false;
  hasNoKeywords = false;
  private readonly _adminData: TopicCloudAdminData;
  private _room: Room;
  private currentTheme: Theme;
  private _subscriptionCommentUpdates: Subscription;
  private _currentModerators: string[];

  constructor(public dialogRef: MatDialogRef<RoomCreatorPageComponent>,
              public dialog: MatDialog,
              public notificationService: NotificationService,
              public translationService: TranslateService,
              protected langService: LanguageService,
              private router: Router,
              protected roomService: RoomService,
              @Inject(MAT_DIALOG_DATA) public data: any,
              public eventService: EventService,
              private topicCloudAdminService: TopicCloudAdminService,
              private moderatorService: ModeratorService,
              private themeService: ThemeService,
              private roomDataService: RoomDataService) {
    langService.langEmitter.subscribe(lang => translationService.use(lang));
    this._adminData = TopicCloudAdminService.getDefaultAdminData;
    this.isTopicRequirementActive = !TopicCloudAdminService.isTopicRequirementDisabled(this._adminData);
  }

  ngOnInit() {
    this.themeService.getTheme().subscribe((themeName) => {
      this.currentTheme = this.themeService.getThemeByKey(themeName);
    });
    this.translationService.use(localStorage.getItem('currentLang'));
    const subscriptionEventService = this.eventService.on<CommentListData>('currentRoomData').subscribe(data => {
      subscriptionEventService.unsubscribe();
      console.log(data.currentFilter);
      this.tmpFilter = data.currentFilter;
      this._room = data.room;
      this.roomDataService.getRoomData(data.room.id).subscribe(roomData => {
        this.comments = roomData;
        this.moderatorService.get(data.room.id).subscribe(moderators => {
          this._currentModerators = moderators.map(moderator => moderator.accountId);
          this.commentsLoadedCallback(true);
        });
      });
      this._subscriptionCommentUpdates = this.roomDataService.receiveUpdates([{ finished: true }])
        .subscribe(_ => this.commentsLoadedCallback());
    });
    this.eventService.broadcast('pushCurrentRoomData');
  }

  ngOnDestroy() {
    if (this._subscriptionCommentUpdates) {
      this._subscriptionCommentUpdates.unsubscribe();
    }
  }

  commentsLoadedCallback(isNew = false) {
    if (!this._currentModerators) {
      return;
    }
    this.allComments = this.getCommentCounts(this.comments);
    this.filteredComments = this.getCommentCounts(this.tmpFilter.checkAll(this.comments));
    if (isNew) {
      this.hasNoKeywords = this.isUpdatable();
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
    WorkerDialogComponent.addWorkTask(this.dialog, this._room);
  }

  getCommentCounts(comments: Comment[]): CommentsCount {
    const [data, users] = TagCloudDataService.buildDataFromComments(this._room.ownerId, this._currentModerators,
      this._adminData, this.roomDataService, comments);
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
      let filter: CommentListFilter;

      switch (this.continueFilter) {
        case 'continueWithAll':
          // all questions allowed
          filter = new CommentListFilter(this.tmpFilter);
          filter.resetToDefault();
          break;

        case 'continueWithAllFromNow':
          filter = new CommentListFilter(this.tmpFilter);
          filter.resetToDefault();
          filter.period = Period.fromNow;
          filter.fromNow = new Date().getTime();
          break;

        case 'continueWithCurr':
          filter = this.tmpFilter;
          break;

        default:
          return;
      }

      localStorage.setItem('tag-cloud-question', this.question);
      this.dialogRef.close();
      this.router.navigateByUrl(this.target).then(() => {
        filter.save();
      });
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

  private isUpdatable(): boolean {
    let count = 0;
    let newCount = 0;
    this.comments.forEach(comment => {
      if (comment.keywordsFromSpacy && comment.keywordsFromSpacy.length) {
        newCount++;
      } else {
        count++;
      }
    });
    if (newCount + count < 1) {
      return false;
    }
    if (this.userRole === UserRole.PARTICIPANT) {
      return newCount < 1;
    }
    if (count * 2 / 3 < newCount) {
      return false;
    }
    return !WorkerDialogComponent.isWorkingOnRoom(this._room.id);
  }
}
