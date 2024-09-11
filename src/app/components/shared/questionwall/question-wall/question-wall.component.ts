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
import { WsCommentService } from '../../../../services/websockets/ws-comment.service';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Rescale } from '../../../../models/rescale';
import { QuestionWallKeyEventSupport } from '../question-wall-key-event-support';
import { RoomDataService } from '../../../../services/util/room-data.service';
import { User } from '../../../../models/user';
import { SessionService } from '../../../../services/util/session.service';
import { Room } from '../../../../models/room';
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
import i18nRaw from './translation/qw.i18n.json';
import { I18nLoader } from '../../../../base/i18n/i18n-loader';

const i18n = I18nLoader.load(i18nRaw);

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
  protected readonly i18n = i18n;

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
              session,
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

  handlePageEvent(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
  }

  getURL() {
    const room = this.sessionService.currentRoom;
    if (!room) {
      return '';
    }
    return `${window.location.protocol}//${window.location.hostname}/participant/room/${room.shortId}`;
  }

  ngOnInit(): void {
    this.session.onInit.subscribe(() => {
      this.cdr.detectChanges();
    });
    this.session.filterChangeListener.subscribe(() => {
      console.log('change');
      this.cdr.detectChanges();
    });
  }

  ngAfterViewInit(): void {
    console.log('ngAfterViewInit');
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

  private initNavigation() {
    applyRoomNavigation(this.injector)
      .pipe(takeUntil(this.destroyer))
      .subscribe();
  }
}
