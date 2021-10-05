import { Component, Input, Output, OnInit, EventEmitter, ViewChild, AfterViewInit } from '@angular/core';
import { Comment } from '../../../models/comment';
import { Vote } from '../../../models/vote';
import { AuthenticationService } from '../../../services/http/authentication.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { CommentService } from '../../../services/http/comment.service';
import { NotificationService } from '../../../services/util/notification.service';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/util/language.service';
import { PresentCommentComponent } from '../_dialogs/present-comment/present-comment.component';
import { MatDialog } from '@angular/material/dialog';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { DeleteCommentComponent } from '../../creator/_dialogs/delete-comment/delete-comment.component';
import { CorrectWrong } from '../../../models/correct-wrong.enum';
import { UserRole } from '../../../models/user-roles.enum';
import { Rescale } from '../../../models/rescale';
import { RowComponent } from '../../../../../projects/ars/src/lib/components/layout/frame/row/row.component';
import { User } from '../../../models/user';
import { RoomDataService } from '../../../services/util/room-data.service';
import { SpacyKeyword } from '../../../services/http/spacy.service';
import { UserBonusTokenComponent } from '../../participant/_dialogs/user-bonus-token/user-bonus-token.component';

@Component({
  selector: 'app-comment',
  templateUrl: './comment.component.html',
  styleUrls: ['./comment.component.scss'],
  animations: [
    trigger('slide', [
      state('hidden', style({ opacity: 0, transform: 'translateY(-10px)' })),
      state('visible', style({ opacity: 1, transform: 'translateY(0)' })),
      transition('hidden <=> visible', animate(700))
    ])
  ]
})

export class CommentComponent implements OnInit, AfterViewInit {

  static COMMENT_MAX_HEIGHT = 150;

  @Input() comment: Comment;
  @Input() moderator: boolean;
  @Input() userRole: UserRole;
  @Input() user: User;
  @Input() disabled = false;
  @Input() usesJoyride = false;
  @Input() commentsWrittenByUser = 1;
  @Output() clickedOnTag = new EventEmitter<string>();
  @Output() clickedOnKeyword = new EventEmitter<string>();
  @Output() clickedUserNumber = new EventEmitter<number>();
  @Output() votedComment = new EventEmitter<string>();
  @ViewChild('commentBody', { static: true }) commentBody: RowComponent;
  @ViewChild('commentBodyInner', { static: true }) commentBodyInner: RowComponent;
  @ViewChild('commentExpander', { static: true }) commentExpander: RowComponent;
  isStudent = false;
  isCreator = false;
  isModerator = false;
  hasVoted = 0;
  language: string;
  deviceType: string;
  inAnswerView = false;
  currentVote: string;
  slideAnimationState = 'hidden';
  roleString: string;
  isExpanded = false;
  isExpandable = false;
  filterProfanityForModerators = false;
  isProfanity = false;

  constructor(protected authenticationService: AuthenticationService,
              private route: ActivatedRoute,
              private location: Location,
              protected router: Router,
              private commentService: CommentService,
              private notification: NotificationService,
              private translateService: TranslateService,
              private roomDataService: RoomDataService,
              public dialog: MatDialog,
              protected langService: LanguageService) {
    langService.langEmitter.subscribe(lang => {
      translateService.use(lang);
      this.language = lang;
    });
  }

  ngOnInit() {
    this.checkProfanity();
    switch (this.userRole) {
      case UserRole.PARTICIPANT.valueOf():
        this.isStudent = true;
        this.roleString = 'participant';
        break;
      case UserRole.CREATOR.valueOf():
        this.isCreator = true;
        this.roleString = 'creator';
        break;
      case UserRole.EXECUTIVE_MODERATOR.valueOf():
        this.isModerator = true;
        this.roleString = 'moderator';
    }
    this.language = localStorage.getItem('currentLang');
    this.translateService.use(this.language);
    this.deviceType = localStorage.getItem('deviceType');
    this.inAnswerView = !this.router.url.includes('comments');
  }

  checkProfanity() {
    if (!this.router.url.includes('moderator/comments')) {
      const subscription = this.roomDataService.checkProfanity(this.comment).subscribe(e => {
        if (e !== null) {
          this.isProfanity = e;
          setTimeout(() => subscription.unsubscribe());
        }
      });
    }
  }

  changeProfanityShowForModerators(comment: Comment) {
    this.roomDataService.applyStateToComment(comment, !this.filterProfanityForModerators);
    this.filterProfanityForModerators = !this.filterProfanityForModerators;
  }

  ngAfterViewInit(): void {
    setTimeout(()=>{
      this.isExpandable = this.commentBody.getRenderedHeight() > CommentComponent.COMMENT_MAX_HEIGHT;
      if (!this.isExpandable) {
        this.commentExpander.ref.nativeElement.style.display = 'none';
      } else {
        this.commentBody.setPx(CommentComponent.COMMENT_MAX_HEIGHT);
        this.commentBody.setOverflow('hidden');
      }
    });
  }

  sortKeywords(keywords: SpacyKeyword[]) {
    return keywords.sort((a, b) => a.text.localeCompare(b.text));
  }

  toggleExpand(evt: MouseEvent) {
    this.isExpanded = !this.isExpanded;
    if (this.isExpanded) {
      this.commentBody.setPx(this.commentBodyInner.getRenderedHeight());
      this.commentBody.setOverflow('visible');
    } else {
      this.commentBody.setPx(CommentComponent.COMMENT_MAX_HEIGHT);
      this.commentBody.setOverflow('hidden');
    }
  }

  changeSlideState(): void {
    this.slideAnimationState = 'visible';
  }

  @Input()
  set parseVote(vote: Vote) {
    if (vote) {
      this.hasVoted = vote.vote;
    }
  }

  setRead(comment: Comment): void {
    this.commentService.toggleRead(comment).subscribe(c => {
      this.comment = c;
      this.checkProfanity();
    });
  }

  markCorrect(comment: Comment, type: CorrectWrong): void {
    if (comment.correct === type) {
      comment.correct = CorrectWrong.NULL;
    } else {
      comment.correct = type;
    }
    this.commentService.markCorrect(comment).subscribe(c => {
      this.comment = c;
      this.checkProfanity();
    });
  }


  setFavorite(comment: Comment): void {
    this.commentService.toggleFavorite(comment).subscribe(c => {
      this.comment = c;
      this.checkProfanity();
    });
  }

  voteUp(comment: Comment): void {
    const userId = this.authenticationService.getUser().id;
    if (this.hasVoted !== 1) {
      this.commentService.voteUp(comment, userId).subscribe(_ => this.votedComment.emit(this.comment.id));
      this.hasVoted = 1;
      this.currentVote = '1';
    } else {
      this.commentService.resetVote(comment, userId).subscribe(_ => this.votedComment.emit(this.comment.id));
      this.hasVoted = 0;
      this.currentVote = '0';
    }
    this.resetVotingAnimation();
  }

  voteDown(comment: Comment): void {
    const userId = this.authenticationService.getUser().id;
    if (this.hasVoted !== -1) {
      this.commentService.voteDown(comment, userId).subscribe(_ => this.votedComment.emit(this.comment.id));
      this.hasVoted = -1;
      this.currentVote = '-1';
    } else {
      this.commentService.resetVote(comment, userId).subscribe(_ => this.votedComment.emit(this.comment.id));
      this.hasVoted = 0;
      this.currentVote = '0';
    }
    this.resetVotingAnimation();
  }

  openDeleteCommentDialog(): void {
    const dialogRef = this.dialog.open(DeleteCommentComponent, {
      width: '400px'
    });
    dialogRef.afterClosed()
        .subscribe(result => {
          if (result === 'delete') {
            this.delete();
          }
        });
  }

  resetVotingAnimation() {
    setTimeout(() => {
          this.currentVote = '';
        },
        1000);
  }

  answerComment() {
    let url: string;
    this.route.params.subscribe(params => {
      url = `${this.roleString}/room/${params['shortId']}/comment/${this.comment.id}`;
    });
    this.router.navigate([url]);
  }

  delete(): void {
    this.commentService.deleteComment(this.comment.id).subscribe(room => {
      this.translateService.get('comment-list.comment-deleted').subscribe(msg => {
        this.notification.show(msg);
      });
    });
  }

  setAck(comment: Comment): void {
    this.commentService.toggleAck(comment).subscribe(c => {
      this.comment = c;
      this.checkProfanity();
    });
  }

  setBookmark(comment: Comment): void {
    this.commentService.toggleBookmark(comment).subscribe(c => {
      this.comment = c;
      this.checkProfanity();
    });
  }

  goToFullScreen(element: Element): void {
    Rescale.requestFullscreen();
  }

  exitFullScreen(): void {
    Rescale.exitFullscreen();
  }

  openPresentDialog(comment: Comment): void {
    if (this.isCreator === true) {
      this.commentService.highlight(comment).subscribe();
      if (!comment.read) {
        this.setRead(comment);
      }
    }
    const dialogRef = this.dialog.open(PresentCommentComponent, {
      position: {
        left: '10px',
        right: '10px'
      },
      maxWidth: '100vw',
      maxHeight: '100vh',
      height: '100%',
      width: '100%'
    });
    dialogRef.componentInstance.body = comment.body;
    dialogRef.afterClosed()
        .subscribe(result => {
          this.commentService.lowlight(comment).subscribe();
          this.exitFullScreen();

        });
  }

  openBonusStarDialog() {
    const dialogRef = this.dialog.open(UserBonusTokenComponent, {
      width: '600px'
    });
    dialogRef.componentInstance.userId = this.user.id;
  }
}
