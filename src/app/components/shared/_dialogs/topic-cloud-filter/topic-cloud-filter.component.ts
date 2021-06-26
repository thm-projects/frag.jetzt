import { Component, Inject, OnInit, Input } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { NotificationService } from '../../../../services/util/notification.service';
import { TranslateService } from '@ngx-translate/core';
import { RoomCreatorPageComponent } from '../../../creator/room-creator-page/room-creator-page.component';
import { LanguageService } from '../../../../services/util/language.service';
import { EventService } from '../../../../services/util/event.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CommentFilter } from '../../../../utils/filter-options';
import { RoomService } from '../../../../services/http/room.service';
import { Comment } from '../../../../models/comment';
import { CommentListData } from '../../comment-list/comment-list.component';

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
export class TopicCloudFilterComponent implements OnInit {
  @Input() target: string;

  continueFilter = 'continueWithCurr';
  comments: Comment[];
  tmpFilter: CommentFilter;
  allComments: CommentsCount;
  filteredComments: CommentsCount;
  disableCurrentFiltersOptions = false;

  constructor(public dialogRef: MatDialogRef<RoomCreatorPageComponent>,
              public dialog: MatDialog,
              public notificationService: NotificationService,
              public translationService: TranslateService,
              protected langService: LanguageService,
              private router: Router,
              protected roomService: RoomService,
              @Inject(MAT_DIALOG_DATA) public data: any,
              public eventService: EventService) {
    langService.langEmitter.subscribe(lang => translationService.use(lang));
  }

  ngOnInit() {
    this.translationService.use(localStorage.getItem('currentLang'));
    const subscriptionEventService = this.eventService.on<CommentListData>('currentRoomData').subscribe(data => {
      subscriptionEventService.unsubscribe();
      this.comments = data.comments;
      this.tmpFilter = data.currentFilter;
      this.allComments = this.getCommentCounts(this.comments);
      this.filteredComments = this.getCommentCounts(this.comments.filter(comment => this.tmpFilter.checkComment(comment)));
      this.commentsLoadedCallback();
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

  getCommentCounts(comments: Comment[]): CommentsCount {
    const counts = new CommentsCount();
    const userSet = new Set<number>();
    const keywordSet = new Set<string>();

    comments.forEach(c => {
      if (c.userNumber) {
        userSet.add(c.userNumber);
      }
      if (c.keywordsFromQuestioner) {
        c.keywordsFromQuestioner.forEach(k => {
          keywordSet.add(k);
        });
      }
    });

    counts.comments = comments.length;
    counts.users = userSet.size;
    counts.keywords = keywordSet.size;
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
          filter = new CommentFilter(); // all questions allowed
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

      CommentFilter.currentFilter = filter;
      this.dialogRef.close(this.router.navigateByUrl(this.target));
    };
  }
}
