import { Component, Inject, Input, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { NotificationService } from '../../../../services/util/notification.service';
import { TranslateService } from '@ngx-translate/core';
import { RoomCreatorPageComponent } from '../../../creator/room-creator-page/room-creator-page.component';
import { LanguageService } from '../../../../services/util/language.service';
import { EventService } from '../../../../services/util/event.service';
import { Router } from '@angular/router';
import { CommentFilter, Period } from '../../../../utils/filter-options';
import { RoomService } from '../../../../services/http/room.service';
import { Comment } from '../../../../models/comment';
import { CommentListData } from '../../comment-list/comment-list.component';
import { TopicCloudAdminService } from '../../../../services/util/topic-cloud-admin.service';
import { KeywordOrFulltext, TopicCloudAdminData } from '../topic-cloud-administration/TopicCloudAdminData';
import { TagCloudDataService } from '../../../../services/util/tag-cloud-data.service';
import { User } from '../../../../models/user';
import { WorkerDialogComponent } from '../worker-dialog/worker-dialog.component';
import { Room } from '../../../../models/room';
import { CloudParameters } from '../../../../utils/cloud-parameters';
import { ThemeService } from '../../../../../theme/theme.service';
import { Theme } from '../../../../../theme/Theme';

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
export class TopicCloudFilterComponent implements OnInit {
  @Input() target: string;
  @Input() user: User;

  question = '';
  continueFilter = 'continueWithAll';
  comments: Comment[];
  tmpFilter: CommentFilter;
  allComments: CommentsCount;
  filteredComments: CommentsCount;
  disableCurrentFiltersOptions = false;
  isTopicRequirementActive = false;
  hasNoKeywords = false;
  private readonly _adminData: TopicCloudAdminData;
  private _room: Room;
  private currentTheme: Theme;

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
              private themeService: ThemeService) {
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
      this.comments = data.comments;
      this.tmpFilter = data.currentFilter;
      this._room = data.room;
      this.allComments = this.getCommentCounts(this.comments);
      this.filteredComments = this.getCommentCounts(this.comments.filter(comment => this.tmpFilter.checkComment(comment)));
      this.commentsLoadedCallback();
      this.hasNoKeywords = this.isUpdatable();
    });
    this.eventService.broadcast('pushCurrentRoomData');
  }

  commentsLoadedCallback() {
    this.disableCurrentFiltersOptions = ((this.allComments.comments === this.filteredComments.comments) &&
      (this.allComments.users === this.filteredComments.users) &&
      (this.allComments.keywords === this.filteredComments.keywords));

    if (this.disableCurrentFiltersOptions) {
      this.continueFilter = 'continueWithAll';
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
    const [data, users] = TagCloudDataService.buildDataFromComments(this._adminData, comments);
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
      let filter: CommentFilter;

      switch (this.continueFilter) {
        case 'continueWithAll':
          // all questions allowed
          filter = new CommentFilter();
          filter.periodSet = Period.all;
          break;

        case 'continueWithAllFromNow':
          filter = CommentFilter.generateFilterNow(this.tmpFilter.filterSelected);
          break;

        case 'continueWithCurr':
          filter = this.tmpFilter;
          break;

        default:
          return;
      }

      localStorage.setItem('tag-cloud-question', this.question);

      CommentFilter.currentFilter = filter;

      this.dialogRef.close(this.router.navigateByUrl(this.target));
    };
  }

  checkForEnter(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      this.confirmButtonActionCallback()();
    }
  }

  private isUpdatable(): boolean {
    if (this.comments.length < 3) {
      return false;
    }
    let count = 0;
    let newCount = 0;
    this.comments.forEach(comment => {
      if (comment.keywordsFromSpacy && comment.keywordsFromSpacy.length) {
        newCount++;
      } else {
        count++;
      }
    });
    if (count * 2 / 3 < newCount) {
      return false;
    }
    return !WorkerDialogComponent.isWorkingOnRoom(this._room.id);
  }
}
