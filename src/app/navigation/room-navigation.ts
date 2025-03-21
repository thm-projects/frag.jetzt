import { Injector } from '@angular/core';
import { Router } from '@angular/router';
import { LivepollService } from 'app/services/http/livepoll.service';
import { AccountStateService } from 'app/services/state/account-state.service';
import {
  ROOM_ROLE_MAPPER,
  RoomStateService,
} from 'app/services/state/room-state.service';
import { EventService } from 'app/services/util/event.service';
import { SessionService } from 'app/services/util/session.service';
import {
  M3HeaderMenu,
  M3HeaderTemplate,
  M3NavigationTemplate,
  addAround,
} from 'modules/navigation/m3-navigation.types';
import {
  Observable,
  combineLatest,
  filter,
  forkJoin,
  map,
  of,
  startWith,
  switchMap,
} from 'rxjs';
import { TopicCloudFilterComponent } from '../room/tag-cloud/dialogs/topic-cloud-filter/topic-cloud-filter.component';
import { MatDialog } from '@angular/material/dialog';
import { RoomDataFilter } from 'app/utils/data-filter-object.lib';
import { TopicCloudBrainstormingComponent } from '../room/tag-cloud/dialogs/topic-cloud-brainstorming/topic-cloud-brainstorming.component';
import { KeycloakRoles, User } from 'app/models/user';
import { CommentSettingsComponent } from 'app/components/creator/_dialogs/comment-settings/comment-settings.component';
import { CommentSettingsDialog } from 'app/models/comment-settings-dialog';
import { RoomService } from 'app/services/http/room.service';
import { Room } from 'app/models/room';
import { ToggleConversationComponent } from 'app/components/creator/_dialogs/toggle-conversation/toggle-conversation.component';
import { BonusTokenComponent } from 'app/components/creator/_dialogs/bonus-token/bonus-token.component';
import { RoomDeleteComponent } from 'app/components/creator/_dialogs/room-delete/room-delete.component';
import { RoomDeleted } from 'app/models/events/room-deleted';
import { DeleteCommentsComponent } from 'app/components/creator/_dialogs/delete-comments/delete-comments.component';
import { CommentService } from 'app/services/http/comment.service';
import { GPTRoomService } from 'app/services/http/gptroom.service';
import { QuotaService } from 'app/services/http/quota.service';

import { MultiLevelDialogComponent } from '../components/shared/_dialogs/multi-level-dialog/multi-level-dialog.component';
import { MULTI_LEVEL_GPT_ROOM_SETTINGS } from '../components/shared/_dialogs/gpt-room-settings/gpt-room-settings.multi-level';
import { saveSettings } from '../components/shared/_dialogs/gpt-room-settings/gpt-room-settings.executor';
import { copyCSVString, exportRoom } from 'app/utils/ImportExportMethods';
import { TranslateService } from '@ngx-translate/core';
import { UserRole } from 'app/models/user-roles.enum';
import { NotificationService } from 'app/services/util/notification.service';
import { BonusTokenService } from 'app/services/http/bonus-token.service';
import { Rescale } from 'app/models/rescale';
import { QrCodeDialogComponent } from '../components/shared/_dialogs/qr-code-dialog/qr-code-dialog.component';
import { PseudonymEditorComponent } from '../components/shared/_dialogs/pseudonym-editor/pseudonym-editor.component';
import {
  getDefaultHeader,
  getDefaultNavigation,
} from 'app/navigation/default-navigation';
import { HEADER, NAVIGATION } from 'modules/navigation/m3-navigation-emitter';
import { clone } from 'app/utils/ts-utils';
import { CommentNotificationDialogComponent } from '../components/shared/_dialogs/comment-notification-dialog/comment-notification-dialog.component';
import { RoomDescriptionSettingsComponent } from 'app/components/creator/_dialogs/room-description-settings/room-description-settings.component';
import { ModeratorsComponent } from 'app/components/shared/_dialogs/moderators/moderators.component';
import { RoomAccessRole } from 'app/base/db/models/db-room-access.model';
import { I18nLoader } from 'app/base/i18n/i18n-loader';

import rawI18n from './room-navigation.i18n.json';
import { toObservable } from '@angular/core/rxjs-interop';
import { windowWatcher } from 'modules/navigation/utils/window-watcher';
import { user$ } from 'app/user/state/user';
import { MatBadgeSize } from '@angular/material/badge';
import { RoomActivityComponent } from 'app/room/room-activity/room-activity.component';
import { RoomSettingsOverviewComponent } from 'app/components/shared/_dialogs/room-settings-overview/room-settings-overview.component';
import {
  uiComments,
  uiModeratedComments,
} from 'app/room/state/comment-updates';
import { afterUpdate } from 'app/room/state/room-updates';
import { room } from 'app/room/state/room';
import { CategoryListCreatorComponent } from 'app/room/dialogs/category-list-creator/category-list-creator.component';
import { ModerationCheckerComponent } from 'app/room/dialogs/moderation-checker/moderation-checker.component';
const i18n = I18nLoader.loadModule(rawI18n);

export const applyRoomNavigation = (injector: Injector): Observable<void> => {
  return combineLatest([
    getRoomHeader(injector),
    getRoomNavigation(injector),
  ]).pipe(
    map(([header, navigation]) => {
      HEADER.set(header);
      NAVIGATION.set(navigation);
    }),
  );
};

export const getRoomHeader = (
  injector: Injector,
): Observable<M3HeaderTemplate> => {
  const roomState = injector.get(RoomStateService);
  return combineLatest([
    getDefaultHeader(injector),
    user$.pipe(filter((e) => Boolean(e))),
    roomState.room$.pipe(filter((e) => Boolean(e))),
    roomState.assignedRole$.pipe(filter((e) => Boolean(e))),
  ]).pipe(
    map(([template, user, room, role]) => {
      template.slogan = RoomActivityComponent;
      const headerOpts = template.options.find(
        (e) => 'id' in e && e.id === 'account',
      ) as M3HeaderMenu;
      headerOpts.items.unshift({
        icon: 'badge',
        title: i18n().qaPseudonym,
        onClick: () => openQAPseudo(user, room, injector),
      });
      if (role === 'Moderator') headerOpts.icon = 'support_agent';
      if (role === 'Creator') headerOpts.icon = 'co_present';
      if (user.hasRole(KeycloakRoles.AdminDashboard))
        headerOpts.icon = 'shield_person';
      return template;
    }),
  );
};

export const getRoomNavigation = (
  injector: Injector,
): Observable<M3NavigationTemplate> => {
  const roomState = injector.get(RoomStateService);
  const router = injector.get(Router);
  const eventService = injector.get(EventService);
  const dialog = injector.get(MatDialog);
  const livepoll = injector.get(LivepollService);
  const session = injector.get(SessionService);

  // Start building
  return combineLatest([
    getDefaultNavigation(injector),
    user$.pipe(filter((e) => Boolean(e))),
    toObservable(room.value).pipe(filter((e) => Boolean(e))),
    roomState.assignedRole$.pipe(filter((e) => Boolean(e))),
    roomState.role$.pipe(filter((e) => Boolean(e))),
    toObservable(i18n),
    toObservable(windowWatcher.isMobile),
    toObservable(uiComments),
    toObservable(uiModeratedComments),
    afterUpdate.pipe(startWith(null)),
  ]).pipe(
    map(
      ([
        template,
        user,
        room,
        assignedRole,
        currentRole,
        i18n,
        isMobile,
        qaNumber,
        moderatedNumber,
      ]) => {
        template = clone(template) as M3NavigationTemplate;
        let url = router.url;
        const hashIndex = url.indexOf('#');
        if (hashIndex > 0) {
          url = url.substring(0, hashIndex);
        }
        if (!url.endsWith('/')) {
          url += '/';
        }
        const roomIndex = url.indexOf('/room/');
        const role = url.substring(1, roomIndex);
        const urlEndIndex = url.indexOf('/', roomIndex + 6);
        const shortId = url.substring(roomIndex + 6, urlEndIndex);
        const isMod = assignedRole !== 'Participant';
        const isOverview = url.endsWith(shortId + '/');
        template.title = i18n.mainMenu;

        const comments = qaNumber?.forumComments || [];
        const [nComments, nBrainstormingSet] = comments.reduce(
          (acc, c) => {
            const id = c.comment.brainstormingSessionId;
            if (id) {
              if (id === room.brainstormingSession.id) {
                acc[1].add(c.comment.brainstormingWordId);
              }
            } else {
              acc[0]++;
            }
            return acc;
          },
          [0, new Set<string>()] as [number, Set<string>],
        );
        // Remove banned words from brainstorming set
        const brainstormWords = room.brainstormingSession?.wordsWithMeta || {};
        Object.keys(brainstormWords).forEach((key) => {
          if (brainstormWords[key].word.banned) {
            nBrainstormingSet.delete(key);
          }
        });
        const nModerationComments = moderatedNumber?.rawComments?.length || 0;

        const livepollActive =
          room?.livepollSession?.active && !room?.livepollSession?.paused;
        const brainstormingActive = room?.brainstormingSession?.active;

        // Navigation
        template.sections.unshift({
          id: 'features',
          kind: 'navigation',
          title: i18n.features.title,
          entries: [
            {
              id: 'forum',
              title: i18n.features.forum,
              icon: 'forum',
              badgeClass: 'badge',
              badgeSize: 'medium' as MatBadgeSize,
              badgeCount: nComments,
              onClick: () => {
                router.navigate([`/${role}/room/${shortId}/comments`]);
                return true;
              },
              activated: url.endsWith(`/${shortId}/comments/`),
            },
            room?.livepollActive &&
              (room.livepollSession || isMod) && {
                id: 'livepoll',
                title: i18n.features.livepoll,
                icon: 'flash_on',
                badgeSize: 'small' as MatBadgeSize,
                badgeCount: livepollActive ? 1 : null,
                onClick: () => {
                  livepoll.open(session);
                  return true;
                },
              },
            room?.chatGptActive && {
              id: 'assistant',
              title: i18n.features.assistant,
              svgIcon: 'fj_robot',
              onClick: () => {
                router.navigate([`/${role}/room/${shortId}/gpt-chat-room`]);
                return true;
              },
              activated: url.endsWith('/gpt-chat-room/'),
            },
            room?.focusActive &&
              !isMobile && {
                id: 'focus',
                title: i18n.features.focus,
                svgIcon: 'fj_beamer',
                onClick: () => {
                  router.navigate([
                    `/${role}/room/${shortId}/comments/questionwall`,
                  ]);
                  return true;
                },
                activated: url.endsWith('/comments/questionwall/'),
              },
            room?.radarActive && {
              id: 'radar',
              title: i18n.features.radar,
              icon: 'radar',
              onClick: () => {
                if (url.endsWith('/tagcloud/')) {
                  return false;
                }
                eventService.broadcast('save-comment-filter');
                const confirmDialogRef = dialog.open(
                  TopicCloudFilterComponent,
                  {
                    minHeight: 'unset',
                    autoFocus: false,
                    data: {
                      filterObject: RoomDataFilter.loadFilter('commentList'),
                    },
                  },
                );
                confirmDialogRef.componentInstance.target = `/${role}/room/${shortId}/comments/tagcloud`;
                confirmDialogRef.componentInstance.userRole =
                  ROOM_ROLE_MAPPER[assignedRole];
                return true;
              },
              activated: url.endsWith('/tagcloud/'),
            },
            room?.brainstormingActive &&
              (room.brainstormingSession || isMod) && {
                id: 'brainstorming',
                title: i18n.features.brainstorming,
                icon: 'tips_and_updates',
                badgeSize: (nBrainstormingSet.size > 0
                  ? 'medium'
                  : 'small') as MatBadgeSize,
                badgeCount: brainstormingActive
                  ? nBrainstormingSet.size || 1
                  : null,
                onClick: () => {
                  if (url.endsWith('/brainstorming/')) {
                    return false;
                  }
                  const confirmDialogRef = dialog.open(
                    TopicCloudBrainstormingComponent,
                    {
                      autoFocus: false,
                      disableClose: true,
                    },
                  );
                  confirmDialogRef.componentInstance.target = `/${role}/room/${shortId}/comments/brainstorming`;
                  confirmDialogRef.componentInstance.userRole =
                    ROOM_ROLE_MAPPER[assignedRole];
                  return true;
                },
                activated: url.endsWith('/brainstorming/'),
              },
            room?.quizActive && {
              id: 'rallye',
              title: i18n.features.rallye,
              icon: 'quiz',
              onClick: () => {
                router.navigate(['/quiz']);
                return true;
              },
            },
            isMod && {
              id: 'moderation',
              title: i18n.features.moderation,
              icon: 'gavel',
              badgeSize: 'medium' as MatBadgeSize,
              badgeCount: nModerationComments,
              onClick: () => {
                router.navigate([
                  `/${role}/room/${shortId}/moderator/comments`,
                ]);
                return true;
              },
              activated: url.endsWith('/moderator/comments/'),
            },
          ].filter(Boolean),
        });
        addAround(
          template,
          'main.my-rooms',
          {
            id: isMod ? 'room-home' : 'reception',
            title: isMod ? i18n.reception : i18n.reception,
            icon: isMod ? 'door_front' : 'door_front',
            onClick: () => {
              router.navigate([`/${role}/room/${shortId}/`]);
              return true;
            },
            activated: isOverview,
          },
          true,
        );
        // Einstellungen
        const isRealMod =
          currentRole !== 'Participant' && assignedRole !== currentRole;
        if (isMod || isRealMod) {
          template.sections.splice(2, 0, {
            id: 'room-settings',
            title: i18n.options.title,
            kind: 'options',
            options: [
              isMod && {
                id: 'qa',
                title: i18n.options.qa.title,
                icon: 'forum',
                options: [
                  {
                    id: 'moderation',
                    title: i18n.options.qa.moderation,
                    icon: 'gavel',
                    onClick: () => {
                      openModeration(room, injector);
                      return false;
                    },
                  },
                  {
                    id: 'conversation',
                    title: i18n.options.qa.conversation,
                    icon: 'forum',
                    onClick: () => {
                      openConversation(room, injector);
                      return false;
                    },
                  },
                  {
                    id: 'categorys',
                    title: i18n.options.qa.categorys,
                    icon: 'sell',
                    onClick: () => {
                      openAIRoomTags(injector);
                      return false;
                    },
                  },
                  room.bonusArchiveActive &&
                    room.mode !== 'PLE' && {
                      id: 'bonus-archive',
                      title: i18n.options.qa.bonusArchive,
                      icon: 'grade',
                      onClick: () => {
                        openBonusArchive(room, injector);
                        return false;
                      },
                    },
                  {
                    id: 'disable-comments',
                    title: i18n.options.qa.disableComments,
                    icon: 'comments_disabled',
                    onClick: () => {
                      saveChanges(
                        room.id,
                        {
                          questionsBlocked: !room.questionsBlocked,
                        },
                        injector,
                      );
                      return false;
                    },
                    switchState: room.questionsBlocked,
                  },
                  {
                    id: 'mail',
                    title: i18n.options.qa.mail,
                    icon: 'mail',
                    onClick: () => {
                      openMail(user, room, injector);
                      return true;
                    },
                  },
                  {
                    id: 'export',
                    title: i18n.options.qa.export,
                    icon: 'file_download',
                    onClick: () => {
                      doExport(user, room, injector);
                      return true;
                    },
                  },
                  {
                    id: 'delete-questions',
                    title: i18n.options.qa.deleteQuestions,
                    icon: 'delete_sweep',
                    onClick: () => {
                      openDeleteComments(room, injector);
                      return false;
                    },
                  },
                ].filter(Boolean),
              },
              isMod && {
                id: 'room',
                title: i18n.options.room.title,
                icon: 'meeting_room',
                options: [
                  {
                    id: 'qr',
                    title: i18n.options.room.qr,
                    icon: 'qr_code',
                    onClick: () => {
                      openQr(room, injector);
                      return true;
                    },
                  },
                  {
                    id: 'features',
                    title: i18n.options.room.features,
                    icon: 'settings_suggest',
                    onClick: () => {
                      openEditRoomSettings(room, injector);
                      return false;
                    },
                  },
                  {
                    id: 'welcome-text',
                    title: i18n.options.room.welcomeText,
                    icon: 'waving_hand',
                    onClick: () => {
                      openEditDescription(room, injector);
                      return false;
                    },
                  },
                  {
                    id: 'test-moderation',
                    title: i18n.options.room.testModeration,
                    icon: 'policy_alert',
                    onClick: () => {
                      ModerationCheckerComponent.open(injector);
                      return false;
                    },
                  },
                  {
                    id: 'moderators',
                    title: i18n.options.room.moderators,
                    icon: 'key',
                    onClick: () => {
                      showModeratorsDialog(room, assignedRole, injector);
                      return false;
                    },
                  },
                  assignedRole === 'Creator' && {
                    id: 'delete-room',
                    title: i18n.options.room.deleteRoom,
                    icon: 'delete',
                    onClick: () => {
                      openDeleteRoom(room, injector);
                      return true;
                    },
                  },
                ].filter(Boolean),
              },
              isMod && {
                id: 'ai',
                title: i18n.options.ai.title,
                svgIcon: 'fj_robot',
                options: [
                  {
                    id: 'quota',
                    title: i18n.options.ai.quota,
                    icon: 'payment',
                    onClick: () => {
                      console.log('Quota clicked');
                      openAISettings(room, injector);
                      return false;
                    },
                  },
                  {
                    id: 'model-selection',
                    svgIcon: 'fj_robot',
                    title: i18n.options.ai.selection,
                    onClick: () => {
                      console.log('Model clicked');
                      return false;
                    },
                  },
                ],
              },
              (isMod || isRealMod) && {
                id: 'switch-view',
                title: i18n.options.switchView,
                icon: 'groups_3',
                onClick: () => {
                  let userRole = 'participant';
                  if (!isMod) {
                    userRole =
                      currentRole === 'Moderator' ? 'moderator' : 'creator';
                  }
                  router.navigate([
                    `/${userRole}/room/${shortId}${url.substring(urlEndIndex)}`,
                  ]);
                  return false;
                },
                switchState: isRealMod,
              },
            ].filter(Boolean),
          });
        }
        return template;
      },
    ),
  );
};

const openModeration = (room: Room, injector: Injector) => {
  const dialog = injector.get(MatDialog);
  const dialogRef = dialog.open(CommentSettingsComponent, {
    width: '400px',
  });
  dialogRef.componentInstance.editRoom = room;
  dialogRef.afterClosed().subscribe((result) => {
    if (result instanceof CommentSettingsDialog) {
      saveChanges(
        room.id,
        {
          threshold: result.threshold,
          directSend: result.directSend,
        },
        injector,
      );
    }
  });
};

const openConversation = (room: Room, injector: Injector) => {
  const dialog = injector.get(MatDialog);
  const dialogRef = dialog.open(ToggleConversationComponent, {
    width: '600px',
    data: {
      conversationDepth: room.conversationDepth,
      directSend: room.directSend,
    },
  });
  dialogRef.componentInstance.editorRoom = room;
  dialogRef.afterClosed().subscribe((result) => {
    if (typeof result === 'number') {
      saveChanges(
        room.id,
        {
          conversationDepth: result,
        },
        injector,
      );
    }
  });
};

const openAIRoomTags = (injector: Injector) => {
  const dialog = injector.get(MatDialog);
  dialog.open(CategoryListCreatorComponent);
};

const openBonusArchive = (room: Room, injector: Injector) => {
  const dialogRef = injector
    .get(MatDialog)
    .open(BonusTokenComponent, { minHeight: 'unset' });
  dialogRef.componentInstance.room = room;
};

const openDeleteRoom = (room: Room, injector: Injector) => {
  const roomService = injector.get(RoomService);
  const eventService = injector.get(EventService);
  const accountState = injector.get(AccountStateService);
  const router = injector.get(Router);
  const dialogRef = RoomDeleteComponent.open(
    injector.get(MatDialog),
    room.name,
  );
  dialogRef.afterClosed().subscribe((result) => {
    if (result === 'delete') {
      roomService.deleteRoom(room.id).subscribe({
        next: () => {
          const event = new RoomDeleted(room.id);
          eventService.broadcast(event.type, event.payload);
          accountState.removeAccess(room.shortId);
          router.navigate(['/user']);
        },
      });
    }
  });
};

const openDeleteComments = (room: Room, injector: Injector) => {
  const dialogRef = injector.get(MatDialog).open(DeleteCommentsComponent, {
    width: '400px',
  });
  dialogRef.componentInstance.roomId = room.id;
  dialogRef.afterClosed().subscribe((result) => {
    if (result === 'delete') {
      injector.get(CommentService).deleteCommentsByRoomId(room.id).subscribe();
    }
  });
};

const openEditDescription = (room: Room, injector: Injector) => {
  RoomDescriptionSettingsComponent.open(injector.get(MatDialog), room);
};

const showModeratorsDialog = (
  room: Room,
  assignedRole: RoomAccessRole,
  injector: Injector,
) => {
  const dialogRef = injector.get(MatDialog).open(ModeratorsComponent, {
    width: '400px',
  });
  dialogRef.componentInstance.roomId = room.id;
  dialogRef.componentInstance.isCreator = assignedRole === 'Creator';
};

const openAISettings = (room: Room, injector: Injector) => {
  const quotaService = injector.get(QuotaService);
  injector
    .get(GPTRoomService)
    .getByRoomId(room.id)
    .pipe(
      switchMap((res) => {
        return forkJoin([
          of(res),
          quotaService.get(res.roomQuotaId),
          quotaService.get(res.moderatorQuotaId),
          quotaService.get(res.participantQuotaId),
        ]);
      }),
    )
    .subscribe(([setting, roomQuota, moderatorQuota, participantQuota]) => {
      MultiLevelDialogComponent.open(
        injector.get(MatDialog),
        MULTI_LEVEL_GPT_ROOM_SETTINGS,
        saveSettings,
        {
          GPTSettings: setting,
          roomQuota,
          moderatorQuota,
          participantQuota,
          roomID: room.id,
        },
      );
    });
};

const doExport = (user: User, room: Room, injector: Injector) => {
  const translateService = injector.get(TranslateService);
  const roomState = injector.get(RoomStateService);
  const notificationService = injector.get(NotificationService);
  const bonusTokenService = injector.get(BonusTokenService);
  const commentService = injector.get(CommentService);
  injector
    .get(SessionService)
    .getModeratorsOnce()
    .subscribe((mods) => {
      exportRoom(
        translateService,
        ROOM_ROLE_MAPPER[roomState.getCurrentRole()] || UserRole.PARTICIPANT,
        notificationService,
        bonusTokenService,
        commentService,
        'room-export',
        user,
        room,
        new Set<string>(mods.map((mod) => mod.accountId)),
      ).subscribe((text) => {
        copyCSVString(
          text[0],
          room.name + '-' + room.shortId + '-' + text[1] + '.csv',
        );
      });
    });
};

const openQr = (room: Room, injector: Injector) => {
  const dialog = injector.get(MatDialog);
  Rescale.requestFullscreen();
  const dialogRef = dialog.open(QrCodeDialogComponent, {
    panelClass: 'screenDialog',
  });
  dialogRef.componentInstance.data = `${location.origin}/participant/room/${room?.shortId}`;
  dialogRef.componentInstance.key = room?.shortId;
  dialogRef.afterClosed().subscribe(() => {
    Rescale.exitFullscreen();
  });
};

const saveChanges = (
  roomId: string,
  partialRoom: Partial<Room>,
  injector: Injector,
) => {
  const roomService = injector.get(RoomService);
  roomService.patchRoom(roomId, partialRoom).subscribe();
};

const openQAPseudo = (user: User, room: Room, injector: Injector) => {
  PseudonymEditorComponent.open(injector.get(MatDialog), user.id, room.id);
};

const openMail = (user: User, room: Room, injector: Injector) => {
  if (!user?.loginId) {
    injector
      .get(TranslateService)
      .get('comment-notification.needs-user-account')
      .subscribe((msg) =>
        injector.get(NotificationService).show(msg, undefined, {
          duration: 7000,
          panelClass: ['snackbar', 'important'],
        }),
      );
    return;
  }
  CommentNotificationDialogComponent.openDialog(injector.get(MatDialog), room);
};

const openEditRoomSettings = (room: Room, injector: Injector) => {
  const ref = injector.get(MatDialog).open(RoomSettingsOverviewComponent);
  ref.componentInstance.awaitComplete = true;
  ref.componentInstance.room = room;
};
