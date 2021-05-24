import { Component, Inject, OnInit, Input } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { NotificationService } from '../../../../services/util/notification.service';
import { TranslateService } from '@ngx-translate/core';
import { RoomCreatorPageComponent } from '../../../creator/room-creator-page/room-creator-page.component';
import { LanguageService } from '../../../../services/util/language.service';
import { EventService } from '../../../../services/util/event.service';
import { Router } from '@angular/router';
import { CommentFilterOptions } from '../../../../utils/filter-options';
import { CommentService } from '../../../../services/http/comment.service';
import { RoomService } from '../../../../services/http/room.service';
import { Comment } from '../../../../models/comment';


class CommentsCount {
  comments : number;
  users: number;
  keywords: number;
}

@Component({
  selector: 'app-topic-cloud-filter',
  templateUrl: './topic-cloud-filter.component.html',
  styleUrls: ['./topic-cloud-filter.component.scss']
})
export class TopicCloudFilterComponent implements OnInit {
  @Input() filteredComments: any;
  @Input() commentsFilteredByTime: any;
  @Input() shortId: string;

  continueFilter = 'continueWithCurr';

  tmpFilter : CommentFilterOptions;
  allCommentsCount : number;
  allCommentsUsers : number;
  allCommentsKeywords : number;

  filteredCommentsCount : number;
  filteredCommentsUsers : number;
  filteredCommentsKeywords : number;

  constructor(public dialogRef: MatDialogRef<RoomCreatorPageComponent>,
              public dialog: MatDialog,
              public notificationService: NotificationService,
              public translationService: TranslateService,
              protected langService: LanguageService,
              private router: Router,
              protected roomService: RoomService,
              private commentService: CommentService,
              @Inject(MAT_DIALOG_DATA) public data: any,
              public eventService: EventService) {
    langService.langEmitter.subscribe(lang => translationService.use(lang));
  }

  ngOnInit() {
    this.translationService.use(localStorage.getItem('currentLang'));
    this.tmpFilter = CommentFilterOptions.readFilter();
    localStorage.setItem("filtertmp", JSON.stringify(this.tmpFilter));

    this.roomService.getRoomByShortId(this.shortId).subscribe(room => {
      this.commentService.getAckComments(room.id).subscribe(comments => { 
        const counts = this.getCommentCounts(comments);
        this.allCommentsCount = counts.comments;
        this.allCommentsUsers = counts.users;
        this.allCommentsKeywords = counts.keywords;
      });
      this.commentService.getFilteredComments(room.id).subscribe(comments => {
        const counts = this.getCommentCounts(comments);
        this.filteredCommentsCount = counts.comments;
        this.filteredCommentsUsers = counts.users;
        this.filteredCommentsKeywords = counts.keywords;
      });
    });
  }

  closeDialog(): void {
  }

  getCommentCounts(comments : Comment[]) : CommentsCount {
    let counts = new CommentsCount();
    let userSet = new Set<number>();
    let keywordSet = new Set<string>();
    
    comments.forEach(c => {
      if (c.userNumber) {
        userSet.add(c.userNumber);
      }
      if (c.keywords) {
        c.keywords.forEach(k => {
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
    return () =>  {
      let filter : CommentFilterOptions;
      
      switch (this.continueFilter) {
        case 'continueWithAll':
          filter = new CommentFilterOptions(); // all questions allowed
          break;
          
        case 'continueWithAllFromNow':
          filter = CommentFilterOptions.generateFilterNow(this.tmpFilter.filterSelected);
          break;
            
        case 'continueWithCurr':
          filter = JSON.parse(localStorage.getItem("filtertmp")) as CommentFilterOptions;
          break;
          
        default:
          return;
      }
          
      CommentFilterOptions.writeFilterStatic(filter);
      this.dialogRef.close(this.router.navigateByUrl('/participant/room/' + this.shortId + '/comments/tagcloud'));
    }
  }
}