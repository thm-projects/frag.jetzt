import { Component, Input, Output, OnInit, EventEmitter } from '@angular/core';
import { Comment } from '../../../models/comment';
import { Vote } from '../../../models/vote';
import { AuthenticationService } from '../../../services/http/authentication.service';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { CommentService } from '../../../services/http/comment.service';
import { NotificationService } from '../../../services/util/notification.service';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/util/language.service';
import { WsCommentServiceService } from '../../../services/websockets/ws-comment-service.service';
import { PresentCommentComponent } from '../_dialogs/present-comment/present-comment.component';
import { CommentAnswerTextComponent } from '../_dialogs/comment-answer-text/comment-answer-text.component';
import { MatDialog } from '@angular/material';
import { animate, keyframes, state, style, transition, trigger } from '@angular/animations';
import { DeleteCommentComponent } from '../../creator/_dialogs/delete-comment/delete-comment.component';
import { CommentAnswerFormComponent } from '../../creator/_dialogs/comment-answer-form/comment-answer-form.component';
import { CorrectWrong } from '../../../models/correct-wrong.enum';
import { UserRole } from '../../../models/user-roles.enum';
import { Rescale } from '../../../models/rescale';

export const rubberBand = [
  style({ transform: 'scale3d(1, 1, 1)', offset: 0 }),
  style({ transform: 'scale3d(1.05, 0.75, 1)', offset: 0.3 }),
  style({ transform: 'scale3d(0.75, 1.05, 1)', offset: 0.4 }),
  style({ transform: 'scale3d(1.05, 0.95, 1)', offset: 0.5 }),
  style({ transform: 'scale3d(0.95, 1.05, 1)', offset: 0.65 }),
  style({ transform: 'scale3d(1.05, 0.95, 1)', offset: 0.75 }),
  style({ transform: 'scale3d(1, 1, 1)', offset: 1 })
];

@Component({
  selector: 'app-comment',
  templateUrl: './comment.component.html',
  styleUrls: ['./comment.component.scss'],
  animations: [
    trigger('slide', [
      state('void', style({ opacity: 0, transform: 'translateY(-10px)' })),
      transition('void <=> *', animate(700)),
    ]),
    trigger('rubberBand', [
      transition('* => rubberBand', animate(1000, keyframes(rubberBand))),
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
  animationState: string;

  constructor(protected authenticationService: AuthenticationService,
    private route: ActivatedRoute,
    private location: Location,
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
        break;
      case UserRole.CREATOR.valueOf():
        this.isCreator = true;
        break;
      case UserRole.EXECUTIVE_MODERATOR.valueOf():
        this.isModerator = true;
    }
    this.language = localStorage.getItem('currentLang');
    this.translateService.use(this.language);
  }

  startAnimation(state_: any): void {
    if (!this.animationState) {
      this.animationState = state_;
    }
  }

  @Input()
  set parseVote(vote: Vote) {
    if (vote) {
      this.hasVoted = vote.vote;
    }
  }

  resetAnimationState(): void {
    this.animationState = '';
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
    } else {
      this.wsCommentService.resetVote(comment, userId);
      this.hasVoted = 0;
      this.startAnimation(0);
    }
  }

  voteDown(comment: Comment): void {
    const userId = this.authenticationService.getUser().id;
    if (this.hasVoted !== -1) {
      this.wsCommentService.voteDown(comment, userId);
      this.hasVoted = -1;
    } else {
      this.wsCommentService.resetVote(comment, userId);
      this.hasVoted = 0;
      this.startAnimation(0);
    }
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

  openAnswerDialog(): void {
    const dialogRef = this.dialog.open(CommentAnswerFormComponent, {
      width: '400px'
    });
    dialogRef.afterClosed()
      .subscribe(result => {
        this.wsCommentService.answer(this.comment, result);
        this.translateService.get('comment-list.comment-answered').subscribe(msg => {
          this.notification.show(msg);
        });
      });
  }

  openAnswerTextDialog(): void {
    const dialogRef = this.dialog.open(CommentAnswerTextComponent, {
      width: '400px'
    });
    dialogRef.componentInstance.answer = this.comment.answer;
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
