import { I18nLoader } from 'app/base/i18n/i18n-loader';
import rawI18n from './brainstorming.i18n.json';
const i18n = I18nLoader.load(rawI18n);

import {
  getRoomHeader,
  getRoomNavigation,
} from 'app/navigation/room-navigation';
import { Injector } from '@angular/core';
import { combineLatest, filter, first, forkJoin, map, switchMap } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import {
  ROOM_ROLE_MAPPER,
  RoomStateService,
} from 'app/services/state/room-state.service';
import { HEADER, NAVIGATION } from 'modules/navigation/m3-navigation-emitter';
import { clone } from 'app/utils/ts-utils';
import {
  M3NavigationEntry,
  M3NavigationTemplate,
  getById,
} from 'modules/navigation/m3-navigation.types';
import { MatDialog } from '@angular/material/dialog';
import { IntroductionBrainstormingComponent } from 'app/components/shared/_dialogs/introductions/introduction-brainstorming/introduction-brainstorming.component';
import { BrainstormingSession } from 'app/models/brainstorming-session';
import { BrainstormingService } from 'app/services/http/brainstorming.service';
import {
  BrainstormingFilter,
  RoomDataFilter,
} from 'app/utils/data-filter-object.lib';
import { RoomAccessRole } from 'app/base/db/models/db-room-access.model';
import { ActivatedRoute, Router } from '@angular/router';
import { Room } from 'app/models/room';
import { windowWatcher } from 'modules/navigation/utils/window-watcher';
import { BrainstormingCategoryEditorComponent } from 'app/components/shared/_dialogs/brainstorming-category-editor/brainstorming-category-editor.component';
import { NotificationService } from 'app/services/util/notification.service';
import { SessionService } from 'app/services/util/session.service';
import { BrainstormingCategory } from 'app/models/brainstorming-category';
import { BrainstormingDeleteConfirmComponent } from 'app/components/shared/_dialogs/brainstorming-delete-confirm/brainstorming-delete-confirm.component';
import { BrainstormingBlacklistEditComponent } from 'app/components/shared/_dialogs/brainstorming-blacklist-edit/brainstorming-blacklist-edit.component';
import { BrainstormingEditComponent } from 'app/components/shared/_dialogs/brainstorming-edit/brainstorming-edit.component';
import { TranslateService } from '@ngx-translate/core';
import { BonusTokenService } from 'app/services/http/bonus-token.service';
import { CommentService } from 'app/services/http/comment.service';
import {
  copyCSVString,
  exportBrainstorming,
} from 'app/utils/ImportExportMethods';
import { UserRole } from 'app/models/user-roles.enum';
import { AccountStateService } from 'app/services/state/account-state.service';

export const applyBrainstormingNavigation = (
  injector: Injector,
  drawerToggle: () => boolean,
) => {
  return combineLatest([
    getRoomHeader(injector),
    getBrainstormingNavigation(injector, drawerToggle),
  ]).pipe(
    map(([header, navigation]) => {
      HEADER.set(header);
      NAVIGATION.set(navigation);
    }),
  );
};

export const getBrainstormingNavigation = (
  injector: Injector,
  drawerToggle: () => boolean,
) => {
  const roomState = injector.get(RoomStateService);
  const sessionService = injector.get(SessionService);
  return combineLatest([
    getRoomNavigation(injector),
    toObservable(i18n),
    roomState.assignedRole$.pipe(filter(Boolean)),
    roomState.room$.pipe(filter(Boolean)),
    sessionService.getCategories(),
  ]).pipe(
    map(([template, i18n, role, room, categories]) => {
      const isMod = role !== 'Participant';
      template = clone(template) as M3NavigationTemplate;
      const entry = getById(
        template,
        'features.brainstorming',
      ) as M3NavigationEntry;
      if (!entry) {
        console.error('Menu not found!');
        return template;
      }
      const hasStarted =
        (room.brainstormingSession?.ideasEndTimestamp || null) !== null;
      const isFrozen = room.brainstormingSession?.ideasFrozen;
      const isActive = room.brainstormingSession?.active;
      entry.options = [
        isMod && {
          id: 'info',
          title: i18n.info,
          icon: 'question_mark',
          onClick: () => {
            openBrainstormingInfoDialog(injector);
            return true;
          },
        },
        isMod &&
          isActive && {
            id: 'play',
            title: hasStarted ? i18n.stop : i18n.start,
            icon: hasStarted ? 'timer_off' : 'timer',
            onClick: () => {
              toggleBrainstormingPlay(injector, room.brainstormingSession);
              return true;
            },
            switchState: hasStarted,
          },
        isMod &&
          isActive && {
            id: 'freeze-ideas',
            title: isFrozen ? i18n.unfreeze : i18n.freeze,
            icon: 'lightbulb_circle',
            onClick: () => {
              toggleBrainstormingFreezeIdeas(
                injector,
                room.brainstormingSession,
              );
              return true;
            },
            switchState: isFrozen,
          },
        isMod &&
          !windowWatcher.isMobile() && {
            id: 'focus-brainstorming',
            title: i18n.focus,
            svgIcon: 'fj_beamer',
            onClick: () => {
              navigateToFocus(injector, room, role);
              return true;
            },
          },
        {
          id: 'brainstorm-comments',
          title: i18n.brainstormComments,
          icon: 'batch_prediction',
          onClick: () => {
            navigateToComments(injector, room.id);
            return true;
          },
        },
        isMod && {
          id: 'categories',
          title: i18n.categories,
          icon: 'interests',
          onClick: () => {
            editCategories(injector, room, i18n, categories);
            return true;
          },
        },
        isMod && {
          id: 'reset-rating',
          title: i18n.resetRating,
          icon: 'model_training',
          onClick: () => {
            resetBrainstormingEntry(
              injector,
              room.brainstormingSession.id,
              'rating',
            );
            return true;
          },
        },
        isMod && {
          id: 'reset-categories',
          title: i18n.resetCategories,
          icon: 'restart_alt',
          onClick: () => {
            resetBrainstormingEntry(
              injector,
              room.brainstormingSession.id,
              'category',
            );
            return true;
          },
        },
        isMod && {
          id: 'freeze-session',
          title: isActive ? i18n.freezeSession : i18n.unfreezeSession,
          icon: isActive ? 'lock_clock' : 'lock_open',
          onClick: () => {
            freezeSession(injector, room.brainstormingSession);
            return true;
          },
          switchState: !isActive,
        },
        isMod && {
          id: 'blacklist',
          title: i18n.blacklist,
          icon: 'info',
          onClick: () => {
            openBrainstormingBlacklist(injector, room, role);
            return true;
          },
        },
        isMod && {
          id: 'settings',
          title: i18n.settings,
          icon: 'handyman',
          onClick: () => {
            openSettings(injector, room.brainstormingSession, role);
            return true;
          },
        },
        {
          id: 'look-and-feel',
          title: i18n.lookAndFeel,
          icon: 'format_paint',
          onClick: drawerToggle,
        },
        {
          id: 'download',
          title: i18n.download,
          icon: 'file_download',
          onClick: () => {
            downloadBrainstormingEntries(injector, room, role);
            return true;
          },
        },
      ].filter(Boolean);
      return template;
    }),
  );
};

const toggleBrainstormingPlay = (
  injector: Injector,
  session: BrainstormingSession,
) => {
  const wasStarted = (session.ideasEndTimestamp || null) !== null;
  const service = injector.get(BrainstormingService);
  if (!wasStarted) {
    const endDate = Date.now() + session.ideasTimeDuration * 60_000;
    service
      .patchSession(session.id, {
        ideasEndTimestamp: endDate as unknown as Date,
        ideasFrozen: false,
      })
      .subscribe();
    return;
  }
  service
    .patchSession(session.id, {
      ideasEndTimestamp: null,
      ideasFrozen: true,
    })
    .subscribe();
};

const toggleBrainstormingFreezeIdeas = (
  injector: Injector,
  session: BrainstormingSession,
) => {
  const service = injector.get(BrainstormingService);
  service
    .patchSession(session.id, {
      ideasFrozen: !session.ideasFrozen,
    })
    .subscribe();
};

const openBrainstormingInfoDialog = (injector: Injector) => {
  injector.get(MatDialog).open(IntroductionBrainstormingComponent, {
    autoFocus: false,
  });
};

const navigateToFocus = (
  injector: Injector,
  room: Room,
  role: RoomAccessRole,
) => {
  const filter = RoomDataFilter.loadFilter('presentation');
  filter.resetToDefault();
  filter.sourceFilterBrainstorming = BrainstormingFilter.OnlyBrainstorming;
  filter.lastRoomId = room.id;
  filter.save();
  injector
    .get(Router)
    .navigate([
      `/${role.toLowerCase()}/room/${room.shortId}/comments/questionwall`,
    ]);
};

const navigateToComments = (injector: Injector, roomId: string) => {
  const filter = RoomDataFilter.loadFilter('commentList');
  filter.resetToDefault();
  filter.sourceFilterBrainstorming = BrainstormingFilter.OnlyBrainstorming;
  filter.lastRoomId = roomId;
  filter.save();
  injector
    .get(Router)
    .navigate(['../'], { relativeTo: injector.get(ActivatedRoute) });
};

const editCategories = (
  injector: Injector,
  room: Room,
  lang: ReturnType<typeof i18n>,
  categories: BrainstormingCategory[],
) => {
  const notificationService = injector.get(NotificationService);
  const dialogRef = injector
    .get(MatDialog)
    .open(BrainstormingCategoryEditorComponent, {
      width: '400px',
    });
  categories = categories || [];
  categories.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
  );
  dialogRef.componentInstance.tags = categories.map((c) => c.name);
  dialogRef.afterClosed().subscribe((result) => {
    if (!result || result === 'abort') {
      return;
    }
    injector
      .get(BrainstormingService)
      .updateCategories(room.id, result)
      .subscribe({
        next: () => {
          notificationService.show(lang.global.changeSuccessful);
        },
        error: () => {
          notificationService.show(lang.global.changesGoneWrong);
        },
      });
  });
};

const resetBrainstormingEntry = (
  injector: Injector,
  sessionId: string,
  type: 'rating' | 'category',
) => {
  const dialogRef = injector
    .get(MatDialog)
    .open(BrainstormingDeleteConfirmComponent, {
      autoFocus: true,
    });
  dialogRef.componentInstance.type = type;
  dialogRef.componentInstance.sessionId = sessionId;
};

const freezeSession = (injector: Injector, session: BrainstormingSession) => {
  const update: Partial<BrainstormingSession> = {};
  if (!session?.active) {
    update.active = true;
  } else {
    update.active = false;
    update.ideasEndTimestamp = null;
    update.ideasFrozen = true;
    update.ratingAllowed = false;
  }
  injector
    .get(BrainstormingService)
    .patchSession(session.id, update)
    .subscribe();
};

const openBrainstormingBlacklist = (
  injector: Injector,
  room: Room,
  role: RoomAccessRole,
) => {
  const ref = injector
    .get(MatDialog)
    .open(BrainstormingBlacklistEditComponent, {
      maxHeight: '95%',
      data: {
        userRole: ROOM_ROLE_MAPPER[role],
      },
    });
  ref.componentInstance.room = room;
};

const openSettings = (
  injector: Injector,
  session: BrainstormingSession,
  role: RoomAccessRole,
) => {
  const dialogRef = injector.get(MatDialog).open(BrainstormingEditComponent, {
    autoFocus: true,
  });
  dialogRef.componentInstance.session = session;
  dialogRef.componentInstance.userRole = ROOM_ROLE_MAPPER[role];
};

const downloadBrainstormingEntries = (
  injector: Injector,
  room: Room,
  role: RoomAccessRole,
) => {
  const translateService = injector.get(TranslateService);
  const notificationService = injector.get(NotificationService);
  const bonusTokenService = injector.get(BonusTokenService);
  const commentService = injector.get(CommentService);
  const account = injector.get(AccountStateService);
  forkJoin([
    account.user$.pipe(first(Boolean)),
    injector.get(SessionService).getModeratorsOnce(),
  ])
    .pipe(
      switchMap(([user, mods]) =>
        exportBrainstorming(
          translateService,
          ROOM_ROLE_MAPPER[role] || UserRole.PARTICIPANT,
          notificationService,
          bonusTokenService,
          commentService,
          'room-export',
          user,
          room,
          new Set(mods.map((m) => m.accountId)),
        ),
      ),
    )
    .subscribe((text) => {
      copyCSVString(
        text[0],
        'brainstorming-' +
          room.name +
          '-' +
          room.shortId +
          '-' +
          text[1] +
          '.csv',
      );
    });
};
