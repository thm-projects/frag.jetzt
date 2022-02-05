import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/util/language.service';
import { CommentService } from '../../../services/http/comment.service';
import { Comment } from '../../../models/comment';
import { UserRole } from '../../../models/user-roles.enum';
import { NotificationService } from '../../../services/util/notification.service';
import { MatDialog } from '@angular/material/dialog';
import { DeleteAnswerComponent } from '../../creator/_dialogs/delete-answer/delete-answer.component';
import { EventService } from '../../../services/util/event.service';
import { WriteCommentComponent } from '../write-comment/write-comment.component';
import { AuthenticationService } from '../../../services/http/authentication.service';
import { User } from '../../../models/user';
import { KeyboardUtils } from '../../../utils/keyboard';
import { KeyboardKey } from '../../../utils/keyboard/keys';
import { RoomDataService } from '../../../services/util/room-data.service';
import { forkJoin, Observable, of } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { SessionService } from '../../../services/util/session.service';
import { Room } from '../../../models/room';
import { VoteService } from '../../../services/http/vote.service';
import { Vote } from '../../../models/vote';
import { Location } from '@angular/common';
import { CreateCommentKeywords, KeywordsResultType } from '../../../utils/create-comment-keywords';
import { SpacyDialogComponent } from '../_dialogs/spacy-dialog/spacy-dialog.component';
import { LanguagetoolService } from '../../../services/http/languagetool.service';
import { DeepLService } from '../../../services/http/deep-l.service';
import { SpacyService } from '../../../services/http/spacy.service';

@Component({
  selector: 'app-comment-answer',
  templateUrl: './comment-answer.component.html',
  styleUrls: ['./comment-answer.component.scss']
})
export class CommentAnswerComponent implements OnInit, OnDestroy {

  @ViewChild(WriteCommentComponent) commentComponent: WriteCommentComponent;

  comment: Comment;
  answer: string;
  isLoading = true;
  userRole: UserRole;
  user: User;
  isStudent = true;
  edit = false;
  room: Room;
  mods: Set<string>;
  vote: Vote;
  isModerationComment = false;
  isSending = false;
  private _commentSubscription;

  constructor(
    protected route: ActivatedRoute,
    private notificationService: NotificationService,
    private translateService: TranslateService,
    protected langService: LanguageService,
    private authenticationService: AuthenticationService,
    protected commentService: CommentService,
    private roomDataService: RoomDataService,
    public dialog: MatDialog,
    private router: Router,
    public eventService: EventService,
    private sessionService: SessionService,
    private voteService: VoteService,
    private location: Location,
    private languagetoolService: LanguagetoolService,
    private deepLService: DeepLService,
    private spacyService: SpacyService,
  ) {
  }

  ngOnInit() {
    this.userRole = this.sessionService.currentRole;
    this.authenticationService.watchUser.subscribe(newUser => {
      if (newUser) {
        this.user = newUser;
      }
    });
    if (this.userRole !== UserRole.PARTICIPANT) {
      this.isStudent = false;
    }
    this.route.params.subscribe(params => {
      const commentId = params['commentId'];
      forkJoin([this.sessionService.getRoomOnce(), this.sessionService.getModeratorsOnce()])
        .subscribe(([room, mods]) => {
          this.room = room;
          this.mods = new Set<string>(mods.map(m => m.accountId));
          this.voteService.getByRoomIdAndUserID(this.sessionService.currentRoom.id, this.user.id).subscribe(votes => {
            this.vote = votes.find(v => v.commentId === commentId);
          });
          this.findComment(commentId).subscribe(result => {
            if (!result) {
              this.onNoComment();
            } else {
              this.onCommentReceive(...result);
            }
          });
        });
    });
  }

  ngOnDestroy() {
    this._commentSubscription?.unsubscribe();
    if (this.comment && !this.isStudent) {
      this.commentService.lowlight(this.comment).subscribe();
    }
  }

  checkForEscape(event: KeyboardEvent) {
    if (KeyboardUtils.isKeyEvent(event, KeyboardKey.Escape)) {
      if (this.eventService.focusOnInput) {
        this.eventService.makeFocusOnInputFalse();
        (document.activeElement as HTMLElement).blur();
        return;
      }
      this.goBackToCommentList();
    }
  }

  checkForBackDropClick(event: PointerEvent, ...elements: Node[]) {
    const target = event.target as Node;
    const parent = document.querySelector('.main_container');
    if (event.target && parent.contains(target) && !elements.some(e => e && e.contains(target))) {
      this.goBackToCommentList();
    }
  }

  goBackToCommentList() {
    this.location.back();
  }

  receiveFromDeepL(body: string) {
    this.saveAnswer(body);
  }

  submitNormal(body: string, text: string, tag: string, name: string, verifiedWithoutDeepl: boolean) {
    this.saveAnswer(body, !verifiedWithoutDeepl);
  }

  saveAnswer(data: string, forward = false): void {
    this.answer = CreateCommentKeywords.transformURLtoQuill(data, true);
    this.edit = !this.answer;
    const previous = this.comment.answer;
    this.comment.answer = this.answer;
    this.generateKeywords(this.comment, forward).subscribe(result => {
      if (!result) {
        this.edit = true;
        this.comment.answer = previous;
        setTimeout(() => {
          this.commentComponent.commentData.currentData = this.answer;
        });
        return;
      }
      this.commentService.answer(this.comment, this.answer, this.comment.answerFulltextKeywords,
        this.comment.answerQuestionerKeywords).subscribe(() => {
        this.translateService.get('comment-page.comment-answered').subscribe(msg => {
          this.notificationService.show(msg);
        });
      });
    });
  }

  openDeleteAnswerDialog(): () => void {
    return () => {
      const dialogRef = this.dialog.open(DeleteAnswerComponent, {
        width: '400px'
      });
      dialogRef.afterClosed()
        .subscribe(result => {
          if (result === 'delete') {
            this.deleteAnswer();
          }
        });
    };
  }

  deleteAnswer() {
    this.commentComponent.commentData.clear();
    this.answer = null;
    this.commentService.answer(this.comment, this.answer).subscribe();
    this.translateService.get('comment-page.answer-deleted').subscribe(msg => {
      this.notificationService.show(msg);
    });
  }

  onEditClick() {
    this.edit = true;
    setTimeout(() => this.commentComponent.commentData.set(this.answer));
  }

  private findComment(commentId: string): Observable<[Comment, boolean]> {
    return this.roomDataService.getRoomDataOnce().pipe(
      map(comments => {
        const foundComment = comments.find(c => c.id === commentId);
        return (foundComment ? [foundComment, false] : null) as [Comment, boolean];
      }),
      mergeMap(current => {
        if (current) {
          return of(current);
        }
        if (!this.roomDataService.canAccessModerator) {
          return of(null);
        }
        return this.roomDataService.getRoomDataOnce(false, true).pipe(
          map(comments => {
            const foundComment = comments.find(c => c.id === commentId);
            return (foundComment ? [foundComment, true] : null) as [Comment, boolean];
          })
        );
      })
    );
  }

  private onCommentReceive(c: Comment, isModerationComment: boolean) {
    this.comment = c;
    this.isModerationComment = isModerationComment;
    this.answer = this.comment.answer;
    this.edit = !this.answer;
    this.isLoading = false;
    this._commentSubscription = this.roomDataService.receiveUpdates([
      { type: 'CommentPatched', finished: true, updates: ['ack'] },
      { type: 'CommentPatched', finished: true, updates: ['answer'] },
      { type: 'CommentDeleted', finished: true }
    ]).subscribe(update => {
      if (update.type === 'CommentPatched') {
        if (update.updates.includes('answer')) {
          this.answer = this.comment.answer;
          this.edit = !this.answer;
        }
        if (update.updates.includes('ack')) {
          this.isModerationComment = !this.isModerationComment;
          if (!this.roomDataService.canAccessModerator) {
            this.onNoComment();
          }
        }
      } else if (update.type === 'CommentDeleted') {
        this.onNoComment();
      }
    });
    if (!this.isStudent) {
      this.commentService.highlight(this.comment).subscribe();
    }
  }

  private onNoComment() {
    this.translateService.get('comment-page.no-comment')
      .subscribe(msg => this.notificationService.show(msg));
    this.goBackToCommentList();
  }

  private generateKeywords(comment: Comment, forward: boolean): Observable<boolean> {
    this.isSending = true;
    return CreateCommentKeywords.generateKeywords(this.languagetoolService, this.deepLService, this.spacyService,
      comment.answer, false, forward, this.commentComponent.selectedLang).pipe(
      mergeMap(result => {
        this.isSending = false;
        comment.language = result.language;
        comment.answerFulltextKeywords = result.keywords;
        comment.answerQuestionerKeywords = [];
        if (forward ||
          ((result.resultType === KeywordsResultType.failure) && !result.wasSpacyError) ||
          result.resultType === KeywordsResultType.badSpelled) {
          return of(true);
        }
        const dialogRef = this.dialog.open(SpacyDialogComponent, {
          data: {
            result: result.resultType,
            comment,
            isAnswer: true
          }
        });
        return dialogRef.afterClosed().pipe(
          map(res => !!res)
        );
      })
    );
  }
}
