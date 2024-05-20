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
  first,
  forkJoin,
  map,
  of,
  switchMap,
} from 'rxjs';
import { TopicCloudFilterComponent } from '../components/shared/_dialogs/topic-cloud-filter/topic-cloud-filter.component';
import { MatDialog } from '@angular/material/dialog';
import { RoomDataFilter } from 'app/utils/data-filter-object.lib';
import { TopicCloudBrainstormingComponent } from '../components/shared/_dialogs/topic-cloud-brainstorming/topic-cloud-brainstorming.component';
import { User } from 'app/models/user';
import { CommentSettingsComponent } from 'app/components/creator/_dialogs/comment-settings/comment-settings.component';
import { CommentSettingsDialog } from 'app/models/comment-settings-dialog';
import { RoomService } from 'app/services/http/room.service';
import { Room } from 'app/models/room';
import { ToggleConversationComponent } from 'app/components/creator/_dialogs/toggle-conversation/toggle-conversation.component';
import { TagsComponent } from 'app/components/creator/_dialogs/tags/tags.component';
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
  const accountState = injector.get(AccountStateService);
  const roomState = injector.get(RoomStateService);
  return combineLatest([
    getDefaultHeader(injector),
    accountState.user$.pipe(first((e) => Boolean(e))),
    roomState.room$.pipe(first((e) => Boolean(e))),
  ]).pipe(
    map(([template, user, room]) => {
      const headerOpts = template.options.find(
        (e) => e.icon === 'account_circle',
      ) as M3HeaderMenu;
      headerOpts.items.unshift({
        icon: 'badge',
        title: i18n().qaPseudonym,
        onClick: () => openQAPseudo(user, room, injector),
      });
      return template;
    }),
  );
};

export const getRoomNavigation = (
  injector: Injector,
): Observable<M3NavigationTemplate> => {
  const accountState = injector.get(AccountStateService);
  const roomState = injector.get(RoomStateService);
  const router = injector.get(Router);
  const eventService = injector.get(EventService);
  const dialog = injector.get(MatDialog);
  const livepoll = injector.get(LivepollService);
  const session = injector.get(SessionService);
  // Start building
  return combineLatest([
    getDefaultNavigation(injector),
    accountState.user$.pipe(first((e) => Boolean(e))),
    roomState.room$.pipe(first((e) => Boolean(e))),
    roomState.assignedRole$.pipe(filter((e) => Boolean(e))),
    roomState.role$.pipe(filter((e) => Boolean(e))),
    toObservable(i18n),
  ]).pipe(
    map(([template, user, room, assignedRole, currentRole, i18n]) => {
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
            onClick: () => {
              router.navigate([`/${role}/room/${shortId}/comments`]);
              return true;
            },
            activated: url.endsWith(`/${shortId}/comments/`),
          },
          room?.livepollActive &&
            (room.livepollSession || isMod) && {
              id: 'flashpoll',
              title: i18n.features.flashpoll,
              icon: 'flash_on',
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
          room?.focusActive && {
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
              const confirmDialogRef = dialog.open(TopicCloudFilterComponent, {
                autoFocus: false,
                data: {
                  filterObject: RoomDataFilter.loadFilter('commentList'),
                },
              });
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
              onClick: () => {
                if (url.endsWith('/brainstorming/')) {
                  return false;
                }
                const confirmDialogRef = dialog.open(
                  TopicCloudBrainstormingComponent,
                  {
                    autoFocus: false,
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
            onClick: () => {
              router.navigate([`/${role}/room/${shortId}/moderator/comments`]);
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
          icon: isMod ? 'room' : 'room',
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
                    openRoomTags(room, injector);
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
                    console.log('Features clicked');
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
    }),
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

const openRoomTags = (room: Room, injector: Injector) => {
  const dialog = injector.get(MatDialog);
  const dialogRef = dialog.open(TagsComponent, {
    width: '400px',
  });
  const tags = [...(room.tags || [])];
  const tagsBefore = [...tags];
  dialogRef.componentInstance.tags = tags;
  dialogRef.afterClosed().subscribe((result) => {
    if (!result || result === 'abort') {
      return;
    }
    if (
      tagsBefore.length === result.length &&
      tagsBefore.every((tag) => result.includes(tag))
    ) {
      return;
    }
    saveChanges(room.id, { tags: result }, injector);
  });
};

const openBonusArchive = (room: Room, injector: Injector) => {
  const dialogRef = injector.get(MatDialog).open(BonusTokenComponent, {
    width: '400px',
  });
  dialogRef.componentInstance.room = room;
};

const openDeleteRoom = (room: Room, injector: Injector) => {
  const roomService = injector.get(RoomService);
  const eventService = injector.get(EventService);
  const accountState = injector.get(AccountStateService);
  const router = injector.get(Router);
  const dialogRef = injector.get(MatDialog).open(RoomDeleteComponent, {
    width: '400px',
  });
  dialogRef.componentInstance.room = room;
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
  const dialogRef = injector
    .get(MatDialog)
    .open(RoomDescriptionSettingsComponent, {
      width: '900px',
      maxWidth: 'calc( 100% - 50px )',
      maxHeight: 'calc( 100vh - 50px )',
      autoFocus: false,
    });
  dialogRef.componentInstance.editRoom = room;
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
