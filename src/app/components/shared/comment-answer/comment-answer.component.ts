import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ComponentRef,
  Injector,
  OnDestroy,
  OnInit,
  Signal,
  ViewChild,
  computed,
  effect,
  inject,
  signal,
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
import { forkJoin, ReplaySubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SessionService } from '../../../services/util/session.service';
import { Comment } from '../../../models/comment';
import { ComponentEvent, sendSyncEvent } from 'app/utils/component-events';
import { AccountStateService } from 'app/services/state/account-state.service';
import {
  ROOM_ROLE_MAPPER,
  RoomStateService,
} from 'app/services/state/room-state.service';
import { MatDialog } from '@angular/material/dialog';
import { applyRoomNavigation } from 'app/navigation/room-navigation';
import { user$ } from 'app/user/state/user';
import {
  UIComment,
  uiComments,
  uiModeratedComments,
} from 'app/room/state/comment-updates';
import { room } from 'app/room/state/room';
import { writeInteractiveComment } from 'app/room/comment/util/create-comment';

@Component({
  selector: 'app-comment-answer',
  templateUrl: './comment-answer.component.html',
  styleUrls: ['./comment-answer.component.scss'],
  standalone: false,
})
export class CommentAnswerComponent
  implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(WriteCommentComponent) commentComponent: WriteCommentComponent;

  canOpenGPT = false;
  consentGPT = false;
  answer = '';
  userRole: UserRole;
  user: User;
  isStudent = true;
  isConversationView: boolean;
  backUrl: string = null;
  commentsEnabled = false;
  roleString: string;
  protected room = room.value;
  protected commentId = signal<string | null>(null);
  protected foundComment: Signal<[UIComment, boolean] | string> = computed(
    () => {
      const id = this.commentId();
      if (!id) return null;
      const c = uiComments();
      if (!c) return null;
      const found = c.rawComments.find((e) => e.comment.id === id);
      if (found) return [found, false] as const;
      const m = uiModeratedComments();
      if (!m) return null;
      const foundM = m.rawComments.find((e) => e.comment.id === id);
      return foundM ? ([foundM, true] as const) : 'Not Found';
    },
  );
  protected comment = computed(() => {
    const c = this.foundComment();
    if (Array.isArray(c)) return c[0];
    return null;
  });
  protected isModerationgComment = computed(() => {
    const c = this.foundComment();
    if (Array.isArray(c)) return c[1];
    return null;
  });
  protected isLoading = computed(() => this.foundComment() === null);
  private injector = inject(Injector);
  private changeDetector = inject(ChangeDetectorRef);
  private _commentSubscription;
  private destroyer = new ReplaySubject(1);
  private _list: ComponentRef<unknown>[];
  private commentOverride: Partial<Comment>;

  constructor(
    protected route: ActivatedRoute,
    private notificationService: NotificationService,
    private translateService: TranslateService,
    protected commentService: CommentService,
    public dialog: MatDialog,
    private router: Router,
    public eventService: EventService,
    private sessionService: SessionService,
    private accountState: AccountStateService,
    private roomState: RoomStateService,
  ) {
    applyRoomNavigation(this.injector)
      .pipe(takeUntil(this.destroyer))
      .subscribe();
    effect(() => {
      if (typeof this.foundComment() === 'string') {
        this.onNoComment();
      }
    });
  }

  get responses() {
    const c = this.comment();
    return c ? [...c.children] : [];
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
      this.commentId.set(commentId);
      forkJoin([this.sessionService.getRoomOnce()]).subscribe(([room]) => {
        this.commentsEnabled =
          this.userRole > UserRole.PARTICIPANT || !room.questionsBlocked;
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
    writeInteractiveComment(this.injector).subscribe((c) => {
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
      this.commentService.lowlight(this.comment().comment).subscribe();
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
    comment.ack = room.value().directSend;
    if (this.commentOverride) {
      for (const key of Object.keys(this.commentOverride)) {
        comment[key] = this.commentOverride[key];
      }
    }
    this.commentService.addComment(comment).subscribe(() => {
      this.translateService
        .get('comment-list.comment-sent')
        .subscribe((msg) => this.notificationService.show(msg));
      this.route.params.subscribe((params) => {
        this.router.navigate([
          `${this.roleString}/room/${params['shortId']}/comment/${this.comment().comment.id}/conversation`,
        ]);
      });
    });
    return () => '';
  }

  private onNoComment() {
    this.translateService
      .get('comment-page.no-comment')
      .subscribe((msg) => this.notificationService.show(msg));
    this.goBackToCommentList();
  }
}
