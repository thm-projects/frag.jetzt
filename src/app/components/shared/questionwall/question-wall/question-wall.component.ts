import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  inject,
  Injector,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { CommentService } from '../../../../services/http/comment.service';
import { Comment } from '../../../../models/comment';
import { WsCommentService } from '../../../../services/websockets/ws-comment.service';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Rescale } from '../../../../models/rescale';
import { QuestionWallKeyEventSupport } from '../question-wall-key-event-support';
import { RoomDataService } from '../../../../services/util/room-data.service';
import { User } from '../../../../models/user';
import { SessionService } from '../../../../services/util/session.service';
import { Room } from '../../../../models/room';
import { IntroductionQuestionWallComponent } from '../../_dialogs/introductions/introduction-question-wall/introduction-question-wall.component';
import {
  BrainstormingFilter,
  Period,
  PeriodKey,
} from '../../../../utils/data-filter-object.lib';
import { ArsDateFormatter } from '../../../../../../projects/ars/src/lib/services/ars-date-formatter.service';
import { ReplaySubject, takeUntil } from 'rxjs';
import { HeaderService } from '../../../../services/util/header.service';
import { ForumComment } from '../../../../utils/data-accessor';
import { AccountStateService } from 'app/services/state/account-state.service';
import { RoomStateService } from 'app/services/state/room-state.service';
import { PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { applyRoomNavigation } from '../../../../navigation/room-navigation';
import {
  QuestionWallService,
  QuestionWallSession,
} from './question-wall.service';
import { QwCommentFocusComponent } from './support-components/qw-comment-focus/qw-comment-focus.component';
import { createCommentListSupport } from './comment-list-support';
import { FilteredDataAccess } from '../../../../utils/filtered-data-access';
import { createComponentBuilder } from '../component-builder-support';

interface CommentCache {
  [commentId: string]: {
    old: boolean;
    date: Date;
  };
}

@Component({
  selector: 'app-question-wall',
  templateUrl: './question-wall.component.html',
  styleUrls: ['./question-wall.component.scss'],
})
export class QuestionWallComponent implements OnInit, AfterViewInit, OnDestroy {
  // @ViewChild(ColComponent) colComponent: ColComponent;
  // @ViewChild('header') headerComponent: RowComponent;
  // @ViewChild('footer') footerComponent: RowComponent;
  // @ViewChild('sidelist') sidelist: ColComponent;

  @ViewChild('outlet', { read: ViewContainerRef, static: true }) set outlet(
    viewContainerRef: ViewContainerRef,
  ) {
    const componentBuilder = createComponentBuilder({
      viewContainerRef,
    });
    this.self.getSession().subscribe((session) => {
      session.focus.pipe(takeUntil(this.destroyer)).subscribe((comment) => {
        if (comment) {
          this.hasCommentFocus = true;
          componentBuilder.destroyAll().subscribe(() => {
            componentBuilder.createComponent(QwCommentFocusComponent, {
              comment,
            });
          });
        } else {
          componentBuilder.destroyAll().subscribe(() => {
            this.hasCommentFocus = false;
          });
        }
      });
    });
  }

  hasCommentFocus: boolean;

  comments: ForumComment[] = [];
  // unused
  sidelistExpanded = true;
  qrCodeExpanded = false;
  commentFocus: ForumComment = null;
  commentFocusId: string = null;
  commentsCountQuestions = 0;
  commentsCountUsers = 0;
  unreadComments = 0;
  focusIncomingComments = true;
  keySupport: QuestionWallKeyEventSupport;
  filterTitle = '';
  filterDesc = '';
  filterIcon = '';
  isSvgIcon = false;
  userMap: Map<string, number> = new Map<string, number>();
  userList: [number, string][] = [];
  userSelection = false;
  fontSize = 180;
  periodsList = Object.values(Period) as PeriodKey[];
  isLoading = true;
  user: User;
  animationTrigger = true;
  firstPassIntroduction = true;
  room: Room = null;
  period: Period;
  // paginator
  pageIndex = 0;
  pageSize = 25;
  pageSizeOptions = [25, 50, 100, 200];
  private readonly commentCache: CommentCache = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private destroyer = new ReplaySubject<any>();

  private injector = inject(Injector);
  protected session: QuestionWallSession | undefined;

  constructor(
    public router: Router,
    private commentService: CommentService,
    private wsCommentService: WsCommentService,
    private translateService: TranslateService,
    private roomDataService: RoomDataService,
    private sessionService: SessionService,
    private dialog: MatDialog,
    public dateFormatter: ArsDateFormatter,
    public headerService: HeaderService,
    private accountState: AccountStateService,
    private roomState: RoomStateService,
    public readonly self: QuestionWallService,
    public readonly cdr: ChangeDetectorRef,
  ) {
    this.keySupport = new QuestionWallKeyEventSupport();
    this.session = self.createSession(
      createCommentListSupport(
        FilteredDataAccess.buildNormalAccess(
          this.sessionService,
          this.roomDataService,
          false,
          'presentation',
        ),
      ),
      this.destroyer,
    );
    this.session.focus.subscribe((focus) => {
      console.log(focus);
    });
    this.initNavigation();
  }

  public wrap<E>(e: E, action: (e: E) => void) {
    action(e);
  }

  public notUndefined<E>(e: E, action: (e: E) => void, elsePart?: () => void) {
    if (e) {
      action(e);
    } else if (elsePart) {
      elsePart();
    }
  }

  handlePageEvent(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
  }

  getSlicedComments(): ForumComment[] {
    const start = this.pageIndex * this.pageSize;
    const end = start + this.pageSize;
    return this.comments.slice(start, end);
  }

  toggleSideList() {
    // this.sidelistExpanded = !this.sidelistExpanded;
    // if (this.sidelistExpanded) {
    //   this.sidelist.setPx(450);
    //   setTimeout(() => {
    //     this.headerComponent.setPx(50);
    //     this.footerComponent.setPx(50);
    //   }, 200);
    // } else {
    //   this.sidelist.setPx(0);
    //   setTimeout(() => {
    //     this.headerComponent.setPx(0);
    //     this.footerComponent.setPx(0);
    //   }, 200);
    // }
  }

  getURL() {
    const room = this.sessionService.currentRoom;
    if (!room) {
      return '';
    }
    return `${window.location.protocol}//${window.location.hostname}/participant/room/${room.shortId}`;
  }

  ngOnInit(): void {
    this.initKeySupport();
    this.session.onInit.subscribe(() => {
      this.cdr.detectChanges();
    });
    this.session.filterChangeListener.subscribe(() => {
      console.log('change');
      this.cdr.detectChanges();
    });
  }

  initKeySupport() {
    this.wrap(this.keySupport, (key) => {
      key.addKeyEvent('ArrowRight', () => this.nextComment());
      key.addKeyEvent('ArrowLeft', () => this.prevComment());
      key.addKeyEvent('ArrowDown', () => this.nextComment());
      key.addKeyEvent('ArrowUp', () => this.prevComment());
      key.addKeyEvent('l', () => this.toggleSideList());
      key.addKeyEvent('q', () => (this.qrCodeExpanded = !this.qrCodeExpanded));
    });
  }

  ngAfterViewInit(): void {
    console.log('ngAfterViewInit');
    // document.getElementById('header_rescale').style.display = 'none';
    // document.getElementById('footer_rescale').style.display = 'none';
    // setTimeout(() => {
    //   Rescale.requestFullscreen();
    // }, 0);
    // setTimeout(() => {
    //   Array.from(
    //     document
    //       .getElementsByClassName('questionwall-screen')[0]
    //       .getElementsByTagName('button'),
    //   ).forEach((e) => {
    //     e.addEventListener('keydown', (e1) => {
    //       e1.preventDefault();
    //     });
    //   });
    // }, 100);
  }

  ngOnDestroy(): void {
    this.destroyer.next(true);
    this.destroyer.complete();
    try {
      const filter = this.self.session.filter.filteredDataAccess.dataFilter;
      if (
        filter.sourceFilterBrainstorming !==
        BrainstormingFilter.ExceptBrainstorming
      ) {
        filter.resetToDefault();
        this.self.session.filter.filteredDataAccess.dataFilter = filter;
      }
    } catch (e) {
      console.error(e);
    }
    try {
      this.self.session.filter.filteredDataAccess.detach(true);
    } catch (e) {
      console.error(e);
    }
    this.keySupport.destroy();
    Rescale.exitFullscreen();
  }

  isOld(commentId: string): boolean {
    return this.commentCache[commentId].old;
  }

  nextComment() {
    this.moveComment(1);
  }

  prevComment() {
    this.moveComment(-1);
  }

  getDOMComments() {
    return Array.from(
      document.getElementsByClassName('questionwall-comment-anchor'),
    );
  }

  getDOMCommentFocus() {
    return this.getDOMComments()[this.getCommentFocusIndex()];
  }

  getCommentFocusIndex() {
    return this.comments.findIndex((c) => c.id === this.commentFocusId);
  }

  moveComment(fx: number) {
    if (!this.comments.length) {
      return;
    }
    if (!this.commentFocusId) {
      this.focusComment(this.comments[0]);
      return;
    }
    const cursor = this.getCommentFocusIndex();
    if (cursor + fx >= this.comments.length || cursor + fx < 0) {
      return;
    } else {
      this.focusComment(this.comments[cursor + fx]);
    }
  }

  focusComment(comment: ForumComment) {
    this.firstPassIntroduction = false;
    if (this.commentFocusId === comment.id) {
      return;
    }
    this.commentFocusId = null;
    this.commentFocus = null;
    setTimeout(() => {
      this.commentFocusId = comment.id;
      this.commentFocus = comment;
      const entry = this.commentCache[comment.id];
      if (!entry.old) {
        entry.old = true;
        this.unreadComments--;
      }
      // this.getDOMCommentFocus().scrollIntoView({
      //   behavior: 'smooth',
      //   block: 'center',
      // });
    }, 1);
  }

  toggleFocusIncomingComments() {
    this.focusIncomingComments = !this.focusIncomingComments;
  }

  applyUserMap(user: string) {
    this.userSelection = false;
    this.self.session.filter.filterUserByNumber(user);
  }

  openUserMap() {
    if (this.userSelection) {
      return;
    }
    this.userSelection = true;
  }

  cancelUserMap() {
    this.userSelection = false;
    this.self.session.filter.deactivateFilter();
  }

  // leave() {
  //   this.router.navigate([
  //     '/' +
  //       this.resolveUserRole() +
  //       '/room/' +
  //       this.sessionService.currentRoom.shortId +
  //       '/comments',
  //   ]);

  // }

  likeComment(comment: Comment) {
    this.commentService.voteUp(comment, this.user.id).subscribe();
  }

  dislikeComment(comment: Comment) {
    this.commentService.voteDown(comment, this.user.id).subscribe();
  }

  openConversation(comment: Comment) {
    sessionStorage.setItem(
      'conversation-fallback-url',
      decodeURI(this.router.url),
    );
    this.router.navigate([
      '/' +
        this.resolveUserRole() +
        '/room/' +
        this.sessionService.currentRoom.shortId +
        '/comment/' +
        comment.id +
        '/conversation',
    ]);
  }

  sliderChange(evt: { value: number }) {
    this.fontSize = evt.value;
  }

  openSiteIntroduction() {
    this.dialog.open(IntroductionQuestionWallComponent, {
      autoFocus: false,
    });
  }

  onUpdateFiltering() {
    this.animationTrigger = false;
    // setTimeout(() => {
    //   this.animationTrigger = true;
    //   if (
    //     this.comments.length < 1 ||
    //     !this.comments.some((c) => c.id === this.commentFocusId)
    //   ) {
    //     this.commentFocusId = null;
    //   }
    // });
  }

  getCommentIcon(comment: Comment): string {
    const isFromOwner = this.room.ownerId === comment?.creatorId;
    let isFromModerator = false;
    this.sessionService
      .getModeratorsOnce()
      .subscribe(
        (mods) =>
          (isFromModerator = mods.some(
            (mod) => mod.accountId === comment?.creatorId,
          )),
      );
    if ((comment?.brainstormingSessionId || null) !== null) {
      return ' tips_and_updates';
    } else if (isFromOwner) {
      return 'co_present';
    } else if (isFromModerator) {
      return 'support_agent';
    }
    return '';
  }

  getCommentIconClass(comment: Comment): string {
    const isFromOwner = this.room.ownerId === comment?.creatorId;
    let isFromModerator = false;
    this.sessionService
      .getModeratorsOnce()
      .subscribe(
        (mods) =>
          (isFromModerator = mods.some(
            (mod) => mod.accountId === comment?.creatorId,
          )),
      );
    if (
      (comment?.brainstormingSessionId || null) !== null ||
      isFromOwner ||
      isFromModerator
    ) {
      return '';
    }
    return 'material-icons-outlined';
  }

  generateCommentNumber(comment: Comment): string {
    if (!comment?.number) {
      return '';
    }
    const meta = comment.number.split('/');
    const topLevelNumber = meta[0];
    const number = meta[meta.length - 1];
    let message = '';
    if (meta.length === 1) {
      this.translateService
        .get('comment-list.question-number', { number })
        .subscribe((msg) => (message = msg.split('/')));
      return message;
    }
    this.translateService
      .get('comment-list.comment-number', {
        topLevelNumber,
        number,
        level: meta.length - 1,
      })
      .subscribe((msg) => (message = msg.split('/')));
    return message;
  }

  private resolveUserRole(): string {
    return this.roomState.getCurrentRole()?.toLowerCase?.() || 'participant';
  }

  private refreshUserMap() {
    this.userMap.clear();
    this.comments.forEach((comment) => {
      this.userMap.set(
        comment.creatorId,
        (this.userMap.get(comment.creatorId) || 0) + 1,
      );
    });
    this.userList.length = 0;
    this.userMap.forEach((num, user) => {
      this.userList.push([num, user]);
    });
  }

  private initNavigation() {
    applyRoomNavigation(this.injector)
      .pipe(takeUntil(this.destroyer))
      .subscribe();
  }

  debugComments() {
    console.log(this.session, this.session?.comments);
  }
}
