import { Component, ComponentRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
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
import { map, mergeMap} from 'rxjs/operators';
import { SessionService } from '../../../services/util/session.service';
import { Room } from '../../../models/room';
import { VoteService } from '../../../services/http/vote.service';
import { Vote } from '../../../models/vote';
import { Location } from '@angular/common';
import { CreateCommentKeywords } from '../../../utils/create-comment-keywords';
import { LanguagetoolService } from '../../../services/http/languagetool.service';
import { DeepLService } from '../../../services/http/deep-l.service';
import { SpacyService } from '../../../services/http/spacy.service';
import { ArsComposeService } from '../../../../../projects/ars/src/lib/services/ars-compose.service';
import { HeaderService } from '../../../services/util/header.service';

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
  isCreator: boolean = false;
  isModerator:  boolean = false;
  edit = false;
  room: Room;
  mods: Set<string>;
  vote: Vote;
  isModerationComment = false;
  isSending = false;
  responses: Comment[] = [];
  isConversationView: boolean;
  roleString: string;
  private _commentSubscription;
  private _list: ComponentRef<any>[];

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
    private composeService: ArsComposeService,
    private headerService: HeaderService,
  ) {
  }

  ngOnInit() {
    this.isConversationView = this.router.url.endsWith('conversation');
    this.userRole = this.sessionService.currentRole;
    this.initNavigation();
    this.authenticationService.watchUser.subscribe(newUser => {
      if (newUser) {
        this.user = newUser;
      }
    });
    if (this.userRole !== UserRole.PARTICIPANT) {
      this.isStudent = false;
    }
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
    this.route.params.subscribe(params => {
      const commentId = params['commentId'];
      forkJoin([this.sessionService.getRoomOnce(), this.sessionService.getModeratorsOnce()])
        .subscribe(([room, mods]) => {
          this.room = room;
          this.mods = new Set<string>(mods.map(m => m.accountId));
          this.voteService.getByRoomIdAndUserID(this.sessionService.currentRoom.id, this.user.id).subscribe(votes => {
            this.vote = votes.find(v => v.commentId === commentId);
          });
          this.getResponses();
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
    this._list?.forEach(e => e.destroy());
    this._commentSubscription?.unsubscribe();
    if (this.comment && !this.isStudent) {
      this.commentService.lowlight(this.comment).subscribe();
    }
  }

  getResponses(){
    this.commentService.getAckComments(this.room.id).subscribe(res => {
      this.responses = res.filter(resp => resp.commentReference === this.comment.id);
    });
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
    const response: Comment = new Comment();
    response.roomId = this.room.id;
    response.body = body;
    response.creatorId = this.user.id;
    response.createdFromLecturer = this.userRole > 0;
    response.commentReference = this.comment.id;
    response.tag = tag;
    response.questionerName = name;
    this.commentService.addComment(response).subscribe(c => {
      let url: string;
      this.route.params.subscribe(params => {
        url = `${this.roleString}/room/${params['shortId']}/comment/${this.comment.id}/conversation`;
      });
      this.router.navigate([url]);
    });
    this.translateService.get('comment-list.comment-sent')
      .subscribe(msg => this.notificationService.show(msg));
  }

  saveAnswer(data: string, forward = false): void {
    this.answer = CreateCommentKeywords.transformURLtoQuill(data, true);
    this.edit = !this.answer;
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
    this.edit = !this.answer;
    this.isLoading = false;
    this._commentSubscription = this.roomDataService.receiveUpdates([
      { type: 'CommentPatched', finished: true, updates: ['ack'] },
      { type: 'CommentDeleted', finished: true }
    ]).subscribe(update => {
      if (update.type === 'CommentPatched') {
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

  private initNavigation() {
    this._list = this.composeService.builder(this.headerService.getHost(), e => {
      e.menuItem({
        translate: this.headerService.getTranslate(),
        icon: 'forum',
        class: 'material-icons-outlined',
        text: 'header.back-to-questionboard',
        callback: () => {
          let role = 'participant';
          if (this.userRole === UserRole.CREATOR) {
            role = 'creator';
          } else if (this.userRole > UserRole.PARTICIPANT) {
            role = 'moderator';
          }
          this.router.navigate([role + '/room/' + this.room?.shortId + '/comments']);
        },
        condition: () => true
      });
    });
  }
}
