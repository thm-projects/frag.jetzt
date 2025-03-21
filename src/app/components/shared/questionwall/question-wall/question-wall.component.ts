import {
  ChangeDetectorRef,
  Component,
  inject,
  Injector,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { Router } from '@angular/router';
import { QuestionWallKeyEventSupport } from '../question-wall-key-event-support';
import { User } from '../../../../models/user';
import { SessionService } from '../../../../services/util/session.service';
import { Room } from '../../../../models/room';
import {
  BrainstormingFilter,
  Period,
} from '../../../../utils/data-filter-object.lib';
import { ReplaySubject, takeUntil } from 'rxjs';
import { HeaderService } from '../../../../services/util/header.service';
import { PageEvent } from '@angular/material/paginator';
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
import { UIComment, uiComments } from 'app/room/state/comment-updates';

const i18n = I18nLoader.load(i18nRaw);

@Component({
  selector: 'app-question-wall',
  templateUrl: './question-wall.component.html',
  styleUrls: ['./question-wall.component.scss'],
  standalone: false,
})
export class QuestionWallComponent implements OnInit, OnDestroy {
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
              comment: uiComments().fastAccess[comment.id],
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

  comments: UIComment[] = [];
  // unused
  keySupport: QuestionWallKeyEventSupport;
  filterTitle = '';
  filterDesc = '';
  filterIcon = '';
  isSvgIcon = false;
  fontSize = 180;
  isLoading = true;
  user: User;
  room: Room = null;
  period: Period;
  // paginator
  pageIndex = 0;
  pageSize = 25;
  pageSizeOptions = [25, 50, 100, 200];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private destroyer = new ReplaySubject<any>();

  private injector = inject(Injector);
  protected session: QuestionWallSession | undefined;

  constructor(
    public router: Router,
    private sessionService: SessionService,
    public headerService: HeaderService,
    public readonly self: QuestionWallService,
    public readonly cdr: ChangeDetectorRef,
  ) {
    this.keySupport = new QuestionWallKeyEventSupport();
    const next = () => {
      if (!this.session?.adjacentComments[1]) return;
      this.session.focus.next(this.session.adjacentComments[1].comment);
    };
    const prev = () => {
      if (!this.session?.adjacentComments[0]) return;
      this.session.focus.next(this.session.adjacentComments[0].comment);
    };
    this.keySupport.addKeyEvent('ArrowLeft', prev);
    this.keySupport.addKeyEvent('ArrowUp', prev);
    this.keySupport.addKeyEvent('ArrowRight', next);
    this.keySupport.addKeyEvent('ArrowDown', next);
    this.keySupport.addKeyEvent(' ', next);
    this.keySupport.addKeyEvent(
      'q',
      () => (this.session.qrcode = !this.session.qrcode),
    );
    this.session = self.createSession(
      createCommentListSupport(
        FilteredDataAccess.buildNormalAccess(
          this.sessionService,
          this.injector,
          false,
          'presentation',
        ),
      ),
      this.destroyer,
    );
    this.session.focus.subscribe(() => {});
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
    if (document.fullscreenEnabled) {
      document.documentElement.requestFullscreen().catch(console.error);
    }
    this.session.onInit.subscribe(() => {
      this.cdr.detectChanges();
    });
    this.session.filterChangeListener.subscribe(() => {
      console.log('change');
      this.cdr.detectChanges();
    });
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
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(console.error);
    }
  }

  private initNavigation() {
    applyRoomNavigation(this.injector)
      .pipe(takeUntil(this.destroyer))
      .subscribe();
  }
}
