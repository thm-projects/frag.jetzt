import { Location } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { NavigationEnd, Router } from '@angular/router';
import { BonusTokenComponent } from 'app/components/creator/_dialogs/bonus-token/bonus-token.component';
import { UserBonusTokenComponent } from 'app/components/participant/_dialogs/user-bonus-token/user-bonus-token.component';
import { Rescale } from 'app/models/rescale';
import { UserRole } from 'app/models/user-roles.enum';
import { DeviceInfoService } from 'app/services/util/device-info.service';
import { EventService } from 'app/services/util/event.service';
import { SessionService } from 'app/services/util/session.service';
import { StartUpService } from 'app/services/util/start-up.service';
import { UserManagementService } from 'app/services/util/user-management.service';
import { RoomDataFilter } from 'app/utils/data-filter-object.lib';
import { filter, ReplaySubject, takeUntil } from 'rxjs';
import { QrCodeDialogComponent } from '../_dialogs/qr-code-dialog/qr-code-dialog.component';
import { RoomSettingsOverviewComponent } from '../_dialogs/room-settings-overview/room-settings-overview.component';
import { TopicCloudBrainstormingComponent } from '../_dialogs/topic-cloud-brainstorming/topic-cloud-brainstorming.component';
import { TopicCloudFilterComponent } from '../_dialogs/topic-cloud-filter/topic-cloud-filter.component';

interface LocationData {
  id: string;
  accessible: boolean;
  active: boolean;
}

interface PossibleLocation {
  i18n: string;
  icon?: string;
  svgIcon?: string;
  class?: string;
  outside?: boolean;
  isCurrentRoute: (route: string) => boolean;
  canBeAccessedOnRoute: (route: string) => boolean;
  navigate: (route: string) => void;
}

type AppLocation = PossibleLocation & LocationData;

const ROOM_REGEX = /^\/(creator|moderator|participant)\/room\/([^/]*)\/?/i;
const COMMENTS_REGEX =
  /^\/(creator|moderator|participant)\/room\/[^/]*\/comments\/?$/i;
const MODERATION_REGEX =
  /^\/(creator|moderator|participant)\/room\/[^/]*\/moderator\/comments\/?$/i;
const FOCUS_REGEX =
  /^\/(creator|moderator|participant)\/room\/[^/]*\/comments\/questionwall\/?$/i;
const RADAR_REGEX =
  /^\/(creator|moderator|participant)\/room\/[^/]*\/comments\/tagcloud\/?$/i;
const BRAINSTORMING_REGEX =
  /^\/(creator|moderator|participant)\/room\/[^/]*\/comments\/brainstorming\/?$/i;
const QUIZ_REGEX = /^\/quiz\/?$/i;
const RECEPTION_REGEX =
  /^\/(creator|moderator|participant)\/room\/([^/]*)\/?$/i;
const USER_REGEX = /^\/user\/?$/i;

export const navigateTopicCloud = (
  router: Router,
  eventService: EventService,
  dialog: MatDialog,
  userRole: UserRole,
) => {
  const url = decodeURI(router.url);
  if (RADAR_REGEX.test(url)) {
    return;
  }
  const data = url.match(ROOM_REGEX);
  eventService.broadcast('save-comment-filter');
  const confirmDialogRef = dialog.open(TopicCloudFilterComponent, {
    autoFocus: false,
    data: {
      filterObject: RoomDataFilter.loadFilter('commentList'),
    },
  });
  confirmDialogRef.componentInstance.target = `${data[1]}/room/${data[2]}/comments/tagcloud`;
  confirmDialogRef.componentInstance.userRole = userRole;
};

export const getBrainstormingURL = (currentUrl: string) => {
  const data = currentUrl.match(ROOM_REGEX);
  return `${data[1]}/room/${data[2]}/comments/brainstorming`;
};

export const navigateBrainstorming = (
  dialog: MatDialog,
  router: Router,
  userRole: UserRole,
) => {
  const confirmDialogRef = dialog.open(TopicCloudBrainstormingComponent, {
    autoFocus: false,
  });
  confirmDialogRef.componentInstance.target = getBrainstormingURL(
    decodeURI(router.url),
  );
  confirmDialogRef.componentInstance.userRole = userRole;
};

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavigationComponent implements OnInit, OnDestroy {
  @Input() isQuestionWall = false;
  readonly possibleLocations: AppLocation[] = [
    {
      id: 'back',
      accessible: true,
      active: false,
      i18n: 'header.back-button',
      icon: 'arrow_back',
      isCurrentRoute: () => false,
      canBeAccessedOnRoute: (route) => route !== '/home',
      navigate: () => {
        this.location.back();
      },
    },
    {
      id: 'forum',
      accessible: false,
      active: false,
      i18n: 'header.back-to-questionboard',
      icon: 'forum',
      class: 'material-icons-outlined',
      isCurrentRoute: (route) => COMMENTS_REGEX.test(route),
      canBeAccessedOnRoute: (route) => ROOM_REGEX.test(route),
      navigate: (route) => {
        const data = route.match(ROOM_REGEX);
        this.router.navigate([`${data[1]}/room/${data[2]}/comments`]);
      },
    },
    {
      id: 'moderation',
      accessible: false,
      active: false,
      i18n: 'header.moderationboard',
      icon: 'gavel',
      class: 'material-icons-round',
      isCurrentRoute: (route) => MODERATION_REGEX.test(route),
      canBeAccessedOnRoute: (route) =>
        ROOM_REGEX.test(route) &&
        this.sessionService.currentRole > UserRole.PARTICIPANT,
      navigate: (route) => {
        const data = route.match(ROOM_REGEX);
        this.router.navigate([`${data[1]}/room/${data[2]}/moderator/comments`]);
      },
    },
    {
      id: 'focus',
      accessible: false,
      active: false,
      i18n: 'header.questionwall',
      svgIcon: 'beamer',
      isCurrentRoute: (route) => FOCUS_REGEX.test(route),
      canBeAccessedOnRoute: (route) => ROOM_REGEX.test(route),
      navigate: (route) => {
        const data = route.match(ROOM_REGEX);
        this.router.navigate([
          `participant/room/${data[2]}/comments/questionwall`,
        ]);
      },
    },
    {
      id: 'radar',
      accessible: false,
      active: false,
      i18n: 'header.tag-cloud',
      icon: 'radar',
      isCurrentRoute: (route) => RADAR_REGEX.test(route),
      canBeAccessedOnRoute: (route) => ROOM_REGEX.test(route),
      navigate: () => {
        navigateTopicCloud(
          this.router,
          this.eventService,
          this.dialog,
          this.sessionService.currentRole,
        );
      },
    },
    {
      id: 'brainstorming',
      accessible: false,
      active: false,
      i18n: 'header.brainstorming',
      icon: 'tips_and_updates',
      class: 'btn-green',
      isCurrentRoute: (route) => BRAINSTORMING_REGEX.test(route),
      canBeAccessedOnRoute: (route) =>
        ROOM_REGEX.test(route) &&
        this.sessionService.currentRoom?.brainstormingActive,
      navigate: (route) => {
        if (BRAINSTORMING_REGEX.test(route)) {
          return;
        }
        if (this.sessionService.currentRole > UserRole.PARTICIPANT) {
          navigateBrainstorming(
            this.dialog,
            this.router,
            this.sessionService.currentRole,
          );
          return;
        }
        const data = route.match(ROOM_REGEX);
        this.router.navigate([
          `${data[1]}/room/${data[2]}/comments/brainstorming`,
        ]);
      },
    },
    {
      id: 'quiz',
      accessible: false,
      active: false,
      i18n: 'header.quiz-now',
      icon: 'rocket_launch',
      isCurrentRoute: (route) => QUIZ_REGEX.test(route),
      canBeAccessedOnRoute: () => this.sessionService.currentRoom?.quizActive,
      navigate: () => {
        this.router.navigate(['/quiz']);
      },
    },
    {
      id: 'reception',
      accessible: false,
      active: false,
      i18n: 'header.back-to-room',
      icon: 'checkroom',
      class: 'material-icons-outlined',
      isCurrentRoute: (route) =>
        RECEPTION_REGEX.test(route) &&
        this.sessionService.currentRole === UserRole.PARTICIPANT,
      canBeAccessedOnRoute: (route) =>
        ROOM_REGEX.test(route) &&
        this.sessionService.currentRole === UserRole.PARTICIPANT,
      navigate: (route) => {
        const data = route.match(ROOM_REGEX);
        this.router.navigate([`${data[1]}/room/${data[2]}`]);
      },
    },
    {
      id: 'room management',
      accessible: false,
      active: false,
      i18n: 'header.back-to-room-moderator',
      icon: 'settings',
      class: 'material-icons-outlined',
      isCurrentRoute: (route) =>
        RECEPTION_REGEX.test(route) &&
        this.sessionService.currentRole > UserRole.PARTICIPANT,
      canBeAccessedOnRoute: (route) =>
        ROOM_REGEX.test(route) &&
        this.sessionService.currentRole > UserRole.PARTICIPANT,
      navigate: (route) => {
        const data = route.match(ROOM_REGEX);
        this.router.navigate([`${data[1]}/room/${data[2]}`]);
      },
    },
    {
      id: 'rooms',
      accessible: false,
      active: false,
      i18n: 'header.my-sessions',
      icon: 'meeting_room',
      class: 'material-icons-outlined',
      outside: true,
      isCurrentRoute: (route) => USER_REGEX.test(route),
      canBeAccessedOnRoute: () =>
        Boolean(this.userManagementService.getCurrentUser()),
      navigate: () => {
        this.router.navigate(['/user']);
      },
    },
    {
      id: 'user stars',
      accessible: false,
      active: false,
      i18n: 'header.user-bonus-token',
      icon: 'grade',
      class: 'btn-yellow',
      outside: true,
      isCurrentRoute: () => false,
      canBeAccessedOnRoute: (route) =>
        Boolean(this.userManagementService.getCurrentUser()) &&
        (!ROOM_REGEX.test(route) ||
          this.sessionService.currentRole === UserRole.PARTICIPANT),
      navigate: () => {
        UserBonusTokenComponent.openDialog(
          this.dialog,
          this.userManagementService.getCurrentUser()?.id,
        );
      },
    },
    {
      id: 'bonus archive',
      accessible: false,
      active: false,
      i18n: 'header.bonustoken',
      icon: 'grade',
      class: 'btn-yellow',
      outside: true,
      isCurrentRoute: () => false,
      canBeAccessedOnRoute: (route) =>
        ROOM_REGEX.test(route) &&
        this.sessionService.currentRole > UserRole.PARTICIPANT &&
        this.sessionService.currentRoom?.bonusArchiveActive,
      navigate: () => {
        const dialogRef = this.dialog.open(BonusTokenComponent, {
          width: '400px',
        });
        dialogRef.componentInstance.room = this.sessionService.currentRoom;
      },
    },
    {
      id: 'qr code',
      accessible: false,
      active: false,
      i18n: 'header.room-qr',
      icon: 'qr_code',
      outside: true,
      isCurrentRoute: () => false,
      canBeAccessedOnRoute: (route) => ROOM_REGEX.test(route),
      navigate: () => {
        this.showQRDialog();
      },
    },
    {
      id: 'room settings',
      accessible: false,
      active: false,
      i18n: 'room-list.settings-overview',
      icon: 'room_preferences',
      class: 'btn-primary',
      outside: true,
      isCurrentRoute: () => false,
      canBeAccessedOnRoute: (route) =>
        ROOM_REGEX.test(route) &&
        this.sessionService.currentRole > UserRole.PARTICIPANT,
      navigate: () => {
        const ref = this.dialog.open(RoomSettingsOverviewComponent, {
          width: '600px',
        });
        ref.componentInstance.room = this.sessionService.currentRoom;
      },
    },
    {
      id: 'news',
      accessible: false,
      active: false,
      i18n: 'header.motd',
      icon: 'campaign',
      class: 'material-icons-outlined',
      outside: true,
      isCurrentRoute: () => false,
      canBeAccessedOnRoute: () =>
        Boolean(this.userManagementService.getCurrentUser()),
      navigate: () => {
        this.startUpService.openMotdDialog();
      },
    },
    {
      id: 'logout',
      accessible: false,
      active: false,
      i18n: 'header.logout',
      icon: 'logout',
      class: 'btn-red',
      outside: true,
      isCurrentRoute: () => false,
      canBeAccessedOnRoute: () =>
        Boolean(this.userManagementService.getCurrentUser()),
      navigate: () => {
        this.userManagementService.logout();
      },
    },
  ];
  currentLocation: PossibleLocation;
  possibleLocationsEmpty = false;
  private readonly destroyer = new ReplaySubject<boolean>(1);

  constructor(
    private detector: ChangeDetectorRef,
    private userManagementService: UserManagementService,
    private startUpService: StartUpService,
    private router: Router,
    private dialog: MatDialog,
    private sessionService: SessionService,
    private location: Location,
    private eventService: EventService,
    public deviceInfo: DeviceInfoService,
  ) {}

  ngOnInit(): void {
    const observer = { next: () => this.refreshLocations() };
    this.sessionService
      .getRole()
      .pipe(takeUntil(this.destroyer))
      .subscribe(observer);
    this.sessionService
      .getRoom()
      .pipe(takeUntil(this.destroyer))
      .subscribe(observer);
    this.router.events
      .pipe(
        takeUntil(this.destroyer),
        filter((e) => e instanceof NavigationEnd),
      )
      .subscribe(observer);
    this.userManagementService
      .getUser()
      .pipe(takeUntil(this.destroyer))
      .subscribe(() => {
        this.refreshLocations();
      });
    setInterval(() => this.detector.detectChanges(), 2000);
  }

  ngOnDestroy(): void {
    this.destroyer.next(true);
    this.destroyer.complete();
  }

  navigateToPage(location: PossibleLocation) {
    location.navigate(decodeURI(this.router.url));
  }

  refreshLocations() {
    const url = decodeURI(this.router.url);
    this.currentLocation = null;
    let anyTrue = false;
    this.possibleLocations.forEach((loc) => {
      loc.accessible = loc.canBeAccessedOnRoute(url);
      loc.active = loc.isCurrentRoute(url);
      if (loc.active) {
        this.currentLocation = loc;
      }
      if (loc.accessible) {
        anyTrue = true;
      }
    });
    this.possibleLocationsEmpty = !anyTrue;
    this.detector.detectChanges();
  }

  private showQRDialog() {
    Rescale.requestFullscreen();
    const dialogRef = this.dialog.open(QrCodeDialogComponent, {
      panelClass: 'screenDialog',
    });
    const room = this.sessionService.currentRoom;
    dialogRef.componentInstance.data = `${location.origin}/participant/room/${room?.shortId}`;
    dialogRef.componentInstance.key = room?.shortId;
    dialogRef.afterClosed().subscribe((res) => {
      Rescale.exitFullscreen();
    });
  }
}
