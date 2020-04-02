import { Component, Input, Output, OnInit, EventEmitter } from '@angular/core';
import { Comment } from '../../../models/comment';
import { Vote } from '../../../models/vote';
import { AuthenticationService } from '../../../services/http/authentication.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { CommentService } from '../../../services/http/comment.service';
import { NotificationService } from '../../../services/util/notification.service';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/util/language.service';
import { WsCommentServiceService } from '../../../services/websockets/ws-comment-service.service';
import { PresentCommentComponent } from '../_dialogs/present-comment/present-comment.component';
import { MatDialog } from '@angular/material/dialog';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { DeleteCommentComponent } from '../../creator/_dialogs/delete-comment/delete-comment.component';
import { CorrectWrong } from '../../../models/correct-wrong.enum';
import { UserRole } from '../../../models/user-roles.enum';
import { Rescale } from '../../../models/rescale';

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

export class CommentComponent implements OnInit {
  @Input() comment: Comment;
  @Input() moderator: boolean;
  @Input() userRole: UserRole;
  @Output()
  clickedOnTag = new EventEmitter<string>();
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

  constructor(protected authenticationService: AuthenticationService,
    private route: ActivatedRoute,
    private location: Location,
    protected router: Router,
    private commentService: CommentService,
    private notification: NotificationService,
    private translateService: TranslateService,
    public dialog: MatDialog,
    protected langService: LanguageService,
    private wsCommentService: WsCommentServiceService) {
    langService.langEmitter.subscribe(lang => {
      translateService.use(lang);
      this.language = lang;
      } );
  }

  ngOnInit() {
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
    this.comment = this.wsCommentService.toggleRead(comment);
  }

  markCorrect(comment: Comment, type: CorrectWrong): void {
      if (comment.correct === type) {
        comment.correct = CorrectWrong.NULL;
      } else {
        comment.correct = type;
      }
    this.comment = this.wsCommentService.markCorrect(comment);
  }

  setFavorite(comment: Comment): void {
    this.comment = this.wsCommentService.toggleFavorite(comment);
  }

  voteUp(comment: Comment): void {
    const userId = this.authenticationService.getUser().id;
    if (this.hasVoted !== 1) {
      this.wsCommentService.voteUp(comment, userId);
      this.hasVoted = 1;
      this.currentVote = '1';
    } else {
      this.wsCommentService.resetVote(comment, userId);
      this.hasVoted = 0;
      this.currentVote = '0';
    }
    this.resetVotingAnimation();
  }

  voteDown(comment: Comment): void {
    const userId = this.authenticationService.getUser().id;
    if (this.hasVoted !== -1) {
      this.wsCommentService.voteDown(comment, userId);
      this.hasVoted = -1;
      this.currentVote = '-1';
    } else {
      this.wsCommentService.resetVote(comment, userId);
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
    this.comment = this.wsCommentService.toggleAck(comment);
  }

  goToFullScreen(element: Element): void {
    Rescale.requestFullscreen();
  }

  exitFullScreen(): void {
    Rescale.exitFullscreen();
  }

  openPresentDialog(comment: Comment): void {
    this.goToFullScreen(document.documentElement);
    if (this.isCreator === true) {
      this.wsCommentService.highlight(comment);
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
        this.wsCommentService.lowlight(comment);
        this.exitFullScreen();

      });
  }
}
