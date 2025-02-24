import rawI18n from './i18n.json';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
const i18n = I18nLoader.load(rawI18n);
import {
  Component,
  inject,
  Inject,
  Injector,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { NotificationService } from '../../../../services/util/notification.service';
import { EventService } from '../../../../services/util/event.service';
import { Router } from '@angular/router';
import { RoomService } from '../../../../services/http/room.service';
import { Comment } from '../../../../models/comment';
import { TopicCloudAdminService } from '../../../../services/util/topic-cloud-admin.service';
import { TopicCloudAdminData } from '../../../../components/shared/_dialogs/topic-cloud-administration/TopicCloudAdminData';
import { TagCloudDataService } from '../../../../services/util/tag-cloud-data.service';
import { WorkerDialogComponent } from '../../../../components/shared/_dialogs/worker-dialog/worker-dialog.component';
import { Room } from '../../../../models/room';
import { ExplanationDialogComponent } from '../../../../components/shared/_dialogs/explanation-dialog/explanation-dialog.component';
import { UserRole } from '../../../../models/user-roles.enum';
import { forkJoin, Observable, ReplaySubject } from 'rxjs';
import { SessionService } from '../../../../services/util/session.service';
import {
  Period,
  RoomDataFilter,
} from '../../../../utils/data-filter-object.lib';
import { FilteredDataAccess } from '../../../../utils/filtered-data-access';
import { map, take, takeUntil } from 'rxjs/operators';
import { DeviceStateService } from 'app/services/state/device-state.service';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { user } from 'app/user/state/user';
import {
  afterUpdate,
  UIComment,
  uiComments,
} from 'app/room/state/comment-updates';

class CommentsCount {
  comments: number;
  users: number;
  keywords: number;
  room: Room;

  areEqual(counts: CommentsCount) {
    if (!counts) {
      return false;
    }
    return (
      counts.users === this.users &&
      counts.comments === this.comments &&
      counts.keywords === this.keywords
    );
  }
}

interface FilterInformation {
  active: boolean;
  count: CommentsCount;
}

const FILTER_TYPES = [
  'all-questions-and-answers',
  'only-questions',
  'current-filter',
  'from-now',
] as const;

type FilterTypeKey = (typeof FILTER_TYPES)[number];

@Component({
  selector: 'app-topic-cloud-filter',
  templateUrl: './topic-cloud-filter.component.html',
  styleUrls: ['./topic-cloud-filter.component.scss'],
  standalone: false,
})
export class TopicCloudFilterComponent implements OnInit, OnDestroy {
  @Input() target: string;
  @Input() userRole: UserRole;

  room: Room;
  isTopicRequirementActive = false;
  hasNoKeywords = false;
  continueFilter: FilterTypeKey = FILTER_TYPES[0];
  filterInfos: { [key in FilterTypeKey]: FilterInformation } = {
    'all-questions-and-answers': {
      active: true,
      count: null,
    },
    'only-questions': {
      active: true,
      count: null,
    },
    'current-filter': {
      active: true,
      count: null,
    },
    'from-now': {
      active: true,
      count: null,
    },
  };
  isMobile = false;
  protected readonly i18n = i18n;
  private readonly _adminData: TopicCloudAdminData;
  private destroyer = new ReplaySubject(1);
  private injector = inject(Injector);

  constructor(
    public dialogRef: MatDialogRef<TopicCloudFilterComponent>,
    public dialog: MatDialog,
    public notificationService: NotificationService,
    private router: Router,
    protected roomService: RoomService,
    @Inject(MAT_DIALOG_DATA) public data: { filterObject: FilteredDataAccess },
    public eventService: EventService,
    private sessionService: SessionService,
    deviceState: DeviceStateService,
  ) {
    this._adminData = TopicCloudAdminService.getDefaultAdminData;
    this.isTopicRequirementActive =
      !TopicCloudAdminService.isTopicRequirementDisabled(this._adminData);
    deviceState.mobile$
      .pipe(takeUntil(this.destroyer))
      .subscribe((m) => (this.isMobile = m));
  }

  public static isUpdatable(
    comments: Comment[],
    userRole: UserRole,
    roomId: string,
  ): boolean {
    const temp = true;
    //TODO: Fix this
    if (temp) return false;
    const data = localStorage.getItem('commentListKeywordGen');
    const set = new Set<string>(data ? JSON.parse(data) : []);
    let count = 0;
    let newCount = 0;
    comments.forEach((comment) => {
      if (comment.keywordsFromSpacy && comment.keywordsFromSpacy.length) {
        newCount++;
      } else {
        count++;
      }
    });
    if (newCount + count < 1) {
      return false;
    }
    if (userRole === UserRole.PARTICIPANT) {
      return (
        newCount < 1 &&
        !set.has(roomId) &&
        !WorkerDialogComponent.isWorkingOnRoom(roomId)
      );
    }
    if ((count * 2) / 3 < newCount) {
      return false;
    }
    return !WorkerDialogComponent.isWorkingOnRoom(roomId);
  }

  public static startUpdate(dialog: MatDialog, room: Room, userRole: UserRole) {
    const data = localStorage.getItem('commentListKeywordGen');
    const set = new Set<string>(data ? JSON.parse(data) : []);
    if (userRole === UserRole.PARTICIPANT && set.has(room.id)) {
      return;
    }
    WorkerDialogComponent.addWorkTask(dialog, room);
    if (userRole === UserRole.PARTICIPANT) {
      localStorage.setItem(
        'commentListKeywordGen',
        JSON.stringify([...set, room.id]),
      );
    }
  }

  ngOnInit() {
    this.commentsLoadedCallback(true);
    afterUpdate
      .pipe(takeUntil(this.destroyer))
      .subscribe(() => this.commentsLoadedCallback());
    this.sessionService.getRoom().subscribe((room) => {
      this.room = room;
    });
  }

  ngOnDestroy() {
    this.destroyer.next(true);
    this.destroyer.complete();
  }

  commentsLoadedCallback(isNew = false) {
    const room = this.sessionService.currentRoom;
    const blacklist = room.blacklist ? JSON.parse(room.blacklist) : [];
    const mods = new Set<string>(
      this.sessionService.currentModerators.map((m) => m.accountId),
    );
    forkJoin([
      this.getFilteredData(blacklist, room, mods, true),
      this.getFilteredData(blacklist, room, mods, false),
      this.getFilteredData(
        blacklist,
        room,
        mods,
        false,
        this.data.filterObject.dataFilter,
      ),
    ]).subscribe(([allComments, onlyQuestions, currentFilter]) => {
      this.filterInfos['all-questions-and-answers'].count = allComments;
      this.filterInfos['only-questions'].count = onlyQuestions;
      this.filterInfos['current-filter'].count = currentFilter;
      for (let i = 2; i < FILTER_TYPES.length; i++) {
        const name = FILTER_TYPES[i];
        const filterInfo = this.filterInfos[name];
        const someEqual = FILTER_TYPES.slice(0, i).some((type) => {
          return this.filterInfos[type].count.areEqual(filterInfo.count);
        });
        filterInfo.active = !someEqual;
        if (!filterInfo.active && this.continueFilter === name) {
          this.continueFilter = FILTER_TYPES[0];
        }
      }
      if (allComments.comments === 0) {
        const last = 'from-now';
        if (this.userRole > UserRole.PARTICIPANT) {
          setTimeout(() => {
            this.continueFilter = last;
          });
        } else {
          setTimeout(() => {
            this.continueFilter = last;
            this.confirm();
          });
        }
      }
    });
    if (isNew) {
      this.hasNoKeywords = TopicCloudFilterComponent.isUpdatable(
        [...uiComments().rawComments.map((e) => e.comment)],
        this.userRole,
        room.id,
      );
    }
  }

  onKeywordRefreshClick() {
    this.hasNoKeywords = false;
    TopicCloudFilterComponent.startUpdate(
      this.dialog,
      this.sessionService.currentRoom,
      this.userRole,
    );
  }

  getCommentCounts(
    comments: UIComment[],
    blacklist: string[],
    blacklistEnabled: boolean,
    ownerId: string,
    mods: Set<string>,
  ): CommentsCount {
    const [data, users] = TagCloudDataService.buildDataFromComments(
      ownerId,
      mods,
      blacklist,
      blacklistEnabled,
      this._adminData,
      comments,
    );
    const counts = new CommentsCount();
    counts.comments = comments.length;
    counts.users = users.size;
    counts.keywords = data.size;
    return counts;
  }

  confirm() {
    const filter = RoomDataFilter.loadFilter('tagCloud');
    filter.resetToDefault();
    filter.lastRoomId = this.sessionService.currentRoom?.id;
    let onlyQuestions = false;
    let roomId: string;
    switch (this.continueFilter) {
      case 'all-questions-and-answers':
        // all questions allowed
        break;
      case 'only-questions':
        onlyQuestions = true;
        break;
      case 'current-filter':
        onlyQuestions = true;
        roomId = filter.lastRoomId;
        filter.applyOptions(this.data.filterObject.dataFilter);
        filter.lastRoomId = roomId;
        break;
      case 'from-now':
        onlyQuestions = true;
        filter.period = Period.FromNow;
        filter.timeFilterStart = Date.now();
        break;
      default:
        return;
    }
    filter.save();
    sessionStorage.setItem('tagCloudOnlyQuestions', String(onlyQuestions));
    this.dialogRef.close();
    this.router.navigateByUrl(this.target);
  }

  checkForEnter(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      this.confirm();
    }
  }

  openHelp() {
    const ref = this.dialog.open(ExplanationDialogComponent, {
      autoFocus: false,
    });
    ref.componentInstance.translateKey = 'explanation.topic-cloud';
  }

  filterTypes() {
    return FILTER_TYPES;
  }

  private getFilteredData(
    blacklist: string[],
    room: Room,
    mods: Set<string>,
    everything: boolean,
    newRoomDataFilter: RoomDataFilter = null,
  ): Observable<CommentsCount> {
    const filter = FilteredDataAccess.buildNormalAccess(
      this.sessionService,
      this.injector,
      everything,
      'dummy',
    );
    if (newRoomDataFilter) {
      filter.dataFilter = newRoomDataFilter;
    } else {
      const newFilter = filter.dataFilter;
      newFilter.resetToDefault();
      filter.dataFilter = newFilter;
    }
    filter.attach({
      userId: user()?.id,
      roomId: room.id,
      ownerId: room.ownerId,
      threshold: room.threshold,
      moderatorIds: mods,
    });
    return filter
      .getFilteredData()
      .pipe(take(1))
      .pipe(
        map((comments) => {
          return this.getCommentCounts(
            [...comments],
            blacklist,
            room.blacklistActive,
            room.ownerId,
            mods,
          );
        }),
      );
  }
}
