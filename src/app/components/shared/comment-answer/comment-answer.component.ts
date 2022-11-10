import {
  Component,
  ComponentRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/util/language.service';
import { CommentService } from '../../../services/http/comment.service';
import { UserRole } from '../../../models/user-roles.enum';
import { NotificationService } from '../../../services/util/notification.service';
import { MatDialog } from '@angular/material/dialog';
import { DeleteAnswerComponent } from '../../creator/_dialogs/delete-answer/delete-answer.component';
import { EventService } from '../../../services/util/event.service';
import { WriteCommentComponent } from '../write-comment/write-comment.component';
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
import { LanguagetoolService } from '../../../services/http/languagetool.service';
import { DeepLService } from '../../../services/http/deep-l.service';
import { SpacyService } from '../../../services/http/spacy.service';
import { ArsComposeService } from '../../../../../projects/ars/src/lib/services/ars-compose.service';
import { HeaderService } from '../../../services/util/header.service';
import { ForumComment } from '../../../utils/data-accessor';
import { KeywordExtractor } from '../../../utils/keyword-extractor';
import { QuillUtils, StandardDelta } from '../../../utils/quill-utils';
import { Comment } from '../../../models/comment';
import { ResponseViewInformation } from '../comment-response-view/comment-response-view.component';
import { UserManagementService } from '../../../services/util/user-management.service';
import { EditQuestionComponent } from '../_dialogs/edit-question/edit-question.component';

@Component({
  selector: 'app-comment-answer',
  templateUrl: './comment-answer.component.html',
  styleUrls: ['./comment-answer.component.scss'],
})
export class CommentAnswerComponent implements OnInit, OnDestroy {
  @ViewChild(WriteCommentComponent) commentComponent: WriteCommentComponent;

  comment: ForumComment;
  answer: StandardDelta;
  isLoading = true;
  userRole: UserRole;
  user: User;
  isStudent = true;
  isCreator: boolean = false;
  isModerator: boolean = false;
  edit = false;
  room: Room;
  mods: Set<string>;
  votes: { [commentId: string]: Vote };
  isModerationComment = false;
  isConversationView: boolean;
  backUrl: string = null;
  roleString: string;
  viewInfo: ResponseViewInformation;
  private _commentSubscription;
  private _list: ComponentRef<any>[];
  private _keywordExtractor: KeywordExtractor;

  constructor(
    protected route: ActivatedRoute,
    private notificationService: NotificationService,
    private translateService: TranslateService,
    protected langService: LanguageService,
    private userManagementService: UserManagementService,
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
    this._keywordExtractor = new KeywordExtractor(
      dialog,
      translateService,
      notificationService,
      roomDataService,
      languagetoolService,
      spacyService,
      deepLService,
    );
  }

  get responses() {
    return [...this.comment.children];
  }

  ngOnInit() {
    this.backUrl = sessionStorage.getItem('conversation-fallback-url');
    this.isConversationView = this.router.url.endsWith('conversation');
    this.initNavigation();
    this.userManagementService.getUser().subscribe((newUser) => {
      if (newUser) {
        this.user = newUser;
      }
    });
    this.sessionService.getRole().subscribe((role) => {
      this.userRole = role;
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
    });
    if (this.userRole !== UserRole.PARTICIPANT) {
      this.isStudent = false;
    }
    if (this.backUrl && this.isConversationView) {
      document.getElementById('header_rescale').style.display = 'none';
    }
    this.route.params.subscribe((params) => {
      const commentId = params['commentId'];
      forkJoin([
        this.sessionService.getRoomOnce(),
        this.sessionService.getModeratorsOnce(),
      ]).subscribe(([room, mods]) => {
        this.room = room;
        this.mods = new Set<string>(mods.map((m) => m.accountId));
        this.votes = {};
        this.voteService
          .getByRoomIdAndUserID(
            this.sessionService.currentRoom.id,
            this.user.id,
          )
          .subscribe((votes) => {
            votes.forEach((v) => (this.votes[v.commentId] = v));
          });
        this.findComment(commentId).subscribe((result) => {
          if (!result) {
            this.onNoComment();
          } else {
            this.onCommentReceive(...result);
          }
        });
      });
    });
  }

  goBack() {
    this.router.navigate([this.backUrl]);
  }

  ngOnDestroy() {
    sessionStorage.removeItem('conversation-fallback-url');
    document.getElementById('header_rescale').style.display = '';
    this._list?.forEach((e) => e.destroy());
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
    if (this.isConversationView) {
      return;
    }
    const target = event.target as Node;
    const parent = document.querySelector('.main_container');
    if (
      event.target &&
      parent.contains(target) &&
      !elements.some((e) => e?.contains(target))
    ) {
      this.goBackToCommentList();
    }
  }

  goBackToCommentList() {
    this.location.back();
  }

  _saveAnswer(data: StandardDelta, _forward = false): void {
    this.answer = QuillUtils.transformURLtoQuillLink(data, true);
    this.edit = !this.answer;
  }

  onSubmit(comment?: Comment): () => void {
    if (comment) {
      comment.ack = this.room.directSend;
      this.commentService.addComment(comment).subscribe((newComment) => {
        this.translateService
          .get('comment-list.comment-sent')
          .subscribe((msg) => this.notificationService.show(msg));
        this.route.params.subscribe((params) => {
          this.router
            .navigate([
              `${this.roleString}/room/${params['shortId']}/comment/${this.comment.id}/conversation`,
            ])
            .then(() => {
              if (!comment.ack) {
                this.roomDataService.dataAccessor.addComment(newComment);
                console.log(newComment.createdAt);
              }
            });
        });
      });
      return;
    }
    const dialogRef = this.dialog.open(DeleteAnswerComponent, {
      width: '400px',
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'delete') {
        this.deleteAnswer();
      }
    });
  }

  deleteAnswer() {
    this.commentComponent.commentData.clear();
    this.answer = null;
    this.translateService
      .get('comment-page.answer-deleted')
      .subscribe((msg) => {
        this.notificationService.show(msg);
      });
  }

  onEditClick() {
    this.edit = true;
    setTimeout(() => this.commentComponent.commentData.set(this.answer));
  }

  editQuestion(comment: ForumComment) {
    const ref = this.dialog.open(EditQuestionComponent, {
      width: '900px',
      maxWidth: '100%',
      maxHeight: 'calc( 100vh - 20px )',
      autoFocus: false,
    });
    ref.componentInstance.comment = comment;
    ref.componentInstance.tags = this.sessionService.currentRoom.tags;
    ref.componentInstance.userRole = this.sessionService.currentRole;
  }

  private findComment(commentId: string): Observable<[ForumComment, boolean]> {
    return this.roomDataService.dataAccessor.getRawComments(true).pipe(
      map((comments) => {
        const foundComment = comments.find((c) => c.id === commentId);
        return (foundComment ? [foundComment, false] : null) as [
          ForumComment,
          boolean,
        ];
      }),
      mergeMap((current) => {
        if (current) {
          return of(current);
        }
        if (!this.roomDataService.canAccessModerator) {
          return of(null);
        }
        return this.roomDataService.moderatorDataAccessor
          .getRawComments(true)
          .pipe(
            map((comments) => {
              const foundComment = comments.find((c) => c.id === commentId);
              return (foundComment ? [foundComment, true] : null) as [
                ForumComment,
                boolean,
              ];
            }),
          );
      }),
    );
  }

  private onCommentReceive(c: ForumComment, isModerationComment: boolean) {
    this.comment = c;
    this.isModerationComment = isModerationComment;
    this.viewInfo = {
      isModerationComment,
      mods: this.mods,
      roomOwner: this.room.ownerId,
      roomThreshold: this.room.threshold,
      roomId: this.room.id,
      votes: this.votes,
      userRole: this.userRole,
      user: this.user,
    };
    this.edit = !this.answer;
    this.isLoading = false;
    const source = isModerationComment
      ? this.roomDataService.moderatorDataAccessor
      : this.roomDataService.dataAccessor;
    this._commentSubscription = source
      .receiveUpdates([
        { type: 'CommentPatched', finished: true, updates: ['ack'] },
        { type: 'CommentDeleted', finished: true },
      ])
      .subscribe((update) => {
        if (update.comment.id !== this.comment.id) {
          return;
        }
        if (update.type === 'CommentPatched' && update.finished === true) {
          if (
            update.updates.includes('ack') &&
            !this.roomDataService.canAccessModerator
          ) {
            this.onNoComment();
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
    this.translateService
      .get('comment-page.no-comment')
      .subscribe((msg) => this.notificationService.show(msg));
    this.goBackToCommentList();
  }

  private initNavigation() {
    this._list = this.composeService.builder(
      this.headerService.getHost(),
      (e) => {
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
            this.router.navigate([
              role + '/room/' + this.room?.shortId + '/comments',
            ]);
          },
          condition: () => true,
        });
      },
    );
  }
}
