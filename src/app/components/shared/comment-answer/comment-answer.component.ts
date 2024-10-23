import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ComponentRef,
  Injector,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { CommentService } from '../../../services/http/comment.service';
import { UserRole } from '../../../models/user-roles.enum';
import { NotificationService } from '../../../services/util/notification.service';
import { EventService } from '../../../services/util/event.service';
import { WriteCommentComponent } from '../write-comment/write-comment.component';
import { User } from '../../../models/user';
import { KeyboardUtils } from '../../../utils/keyboard';
import { KeyboardKey } from '../../../utils/keyboard/keys';
import { RoomDataService } from '../../../services/util/room-data.service';
import { forkJoin, Observable, of, ReplaySubject } from 'rxjs';
import { first, map, mergeMap, takeUntil } from 'rxjs/operators';
import { SessionService } from '../../../services/util/session.service';
import { Room } from '../../../models/room';
import { VoteService } from '../../../services/http/vote.service';
import { Vote } from '../../../models/vote';
import { Location } from '@angular/common';
import { ArsComposeService } from '../../../../../projects/ars/src/lib/services/ars-compose.service';
import { HeaderService } from '../../../services/util/header.service';
import { ForumComment } from '../../../utils/data-accessor';
import { KeywordExtractor } from '../../../utils/keyword-extractor';
import { Comment } from '../../../models/comment';
import { EditQuestionComponent } from '../_dialogs/edit-question/edit-question.component';
import { CreateCommentWrapper } from 'app/utils/create-comment-wrapper';
import { ComponentEvent, sendSyncEvent } from 'app/utils/component-events';
import { AccountStateService } from 'app/services/state/account-state.service';
import {
  ROOM_ROLE_MAPPER,
  RoomStateService,
} from 'app/services/state/room-state.service';
import { MatDialog } from '@angular/material/dialog';
import { M3NavigationService } from '../../../../modules/m3/services/navigation/m3-navigation.service';
import { M3NavigationUtility } from '../../../../modules/m3/components/navigation/m3-navigation-types';
import { HeaderComponent } from '../header/header.component';
import { applyRoomNavigation } from 'app/navigation/room-navigation';
import { user$ } from 'app/user/state/user';

@Component({
  selector: 'app-comment-answer',
  templateUrl: './comment-answer.component.html',
  styleUrls: ['./comment-answer.component.scss'],
})
export class CommentAnswerComponent
  implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(WriteCommentComponent) commentComponent: WriteCommentComponent;

  canOpenGPT = false;
  consentGPT = false;
  comment: ForumComment;
  answer = '';
  isLoading = true;
  userRole: UserRole;
  user: User;
  isStudent = true;
  room: Room;
  mods: Set<string>;
  votes: { [commentId: string]: Vote };
  isModerationComment = false;
  isConversationView: boolean;
  backUrl: string = null;
  commentsEnabled = false;
  roleString: string;
  private injector = inject(Injector);
  private changeDetector = inject(ChangeDetectorRef);
  private createCommentWrapper: CreateCommentWrapper = null;
  private _commentSubscription;
  private destroyer = new ReplaySubject(1);
  private _list: ComponentRef<unknown>[];
  private _keywordExtractor: KeywordExtractor;
  private commentOverride: Partial<Comment>;

  constructor(
    protected route: ActivatedRoute,
    private notificationService: NotificationService,
    private translateService: TranslateService,
    protected commentService: CommentService,
    private roomDataService: RoomDataService,
    public dialog: MatDialog,
    private router: Router,
    public eventService: EventService,
    private sessionService: SessionService,
    private voteService: VoteService,
    private location: Location,
    private composeService: ArsComposeService,
    private headerService: HeaderService,
    private accountState: AccountStateService,
    private roomState: RoomStateService,
    private readonly m3NavigationService: M3NavigationService,
    injector: Injector,
  ) {
    applyRoomNavigation(this.injector)
      .pipe(takeUntil(this.destroyer))
      .subscribe();
    this.m3NavigationService.emit(
      M3NavigationUtility.emptyPortal(HeaderComponent),
    );
    this._keywordExtractor = new KeywordExtractor(injector);
  }

  get responses() {
    return [...this.comment.children];
  }

  ngOnInit() {
    this.accountState.gptConsented$
      .pipe(takeUntil(this.destroyer))
      .subscribe((state) => {
        this.consentGPT = state;
      });
    this.sessionService
      .getGPTStatusOnce()
      .subscribe(
        (data) => (this.canOpenGPT = Boolean(data) && !data.restricted),
      );
    this.backUrl = sessionStorage.getItem('conversation-fallback-url');
    this.isConversationView = this.router.url.endsWith('conversation');
    this.initNavigation();
    user$.pipe(takeUntil(this.destroyer)).subscribe((newUser) => {
      if (newUser) {
        this.user = newUser;
      }
    });
    this.roomState.assignedRole$.subscribe((role) => {
      this.userRole = ROOM_ROLE_MAPPER[role];
      this.roleString = role?.toLocaleLowerCase?.() || 'participant';
      this.isStudent = !role || role === 'Participant';
    });
    if (this.backUrl && this.isConversationView) {
      document.getElementById('header_rescale').style.display = 'none';
    }
    this.route.params.subscribe((params) => {
      const commentId = params['commentId'];
      forkJoin([
        this.sessionService.getRoomOnce(),
        this.sessionService.getModeratorsOnce(),
        user$.pipe(first(Boolean)),
      ]).subscribe(([room, mods, user]) => {
        this.room = room;
        this.commentsEnabled =
          this.userRole > UserRole.PARTICIPANT || !room.questionsBlocked;
        this.createCommentWrapper = new CreateCommentWrapper(
          this.translateService,
          this.notificationService,
          this.commentService,
          this.dialog,
          this.room,
        );
        this.mods = new Set<string>(mods.map((m) => m.accountId));
        this.votes = {};
        this.voteService
          .getByRoomIdAndUserID(this.sessionService.currentRoom.id, user.id)
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

  ngAfterViewInit(): void {
    sendSyncEvent(
      this.eventService,
      new ComponentEvent(
        'comment-answer.receive-startup',
        'comment-answer.on-startup',
      ),
    ).subscribe((next) => {
      const { ...elements } = next as Partial<Comment>;
      this.commentOverride = elements;
      //TODO: this.commentComponent.commentData.currentData = body as StandardDelta;
    });
  }

  writeComment() {
    this.createCommentWrapper
      .openCreateDialog(this.user, this.userRole)
      .subscribe((c) => {
        if (c) {
          this.goBackToCommentList();
        }
      });
  }

  goBack() {
    this.router.navigate([this.backUrl]);
  }

  ngOnDestroy() {
    this.destroyer.next(true);
    this.destroyer.complete();
    sessionStorage.removeItem('conversation-fallback-url');
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

  checkForBackDropClick(event: MouseEvent, ...elements: Node[]) {
    if (this.isConversationView || !this.isConversationView) {
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
    this.router.navigate([
      this.router.url.split('/', 4).join('/') + '/comments',
    ]);
  }

  onSubmit(comment?: Comment): () => void {
    if (!comment) {
      if (this.backUrl) {
        this.goBack();
      } else {
        this.goBackToCommentList();
      }
      return () => '';
    }
    comment.ack = this.room.directSend;
    if (this.commentOverride) {
      for (const key of Object.keys(this.commentOverride)) {
        comment[key] = this.commentOverride[key];
      }
    }
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
            }
          });
      });
    });
    return () => '';
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
    ref.componentInstance.userRole =
      ROOM_ROLE_MAPPER[this.roomState.getCurrentAssignedRole()];
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
    this.changeDetector.markForCheck();
  }

  private onNoComment() {
    this.translateService
      .get('comment-page.no-comment')
      .subscribe((msg) => this.notificationService.show(msg));
    this.goBackToCommentList();
  }

  private initNavigation() {
    if (!this.headerService.getHost()) {
      return;
    }
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
