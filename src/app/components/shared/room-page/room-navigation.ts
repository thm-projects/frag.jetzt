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
  M3NavigationOptionSection,
  M3NavigationSection,
  M3NavigationTemplate,
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
import { TopicCloudFilterComponent } from '../_dialogs/topic-cloud-filter/topic-cloud-filter.component';
import { MatDialog } from '@angular/material/dialog';
import { RoomDataFilter } from 'app/utils/data-filter-object.lib';
import { TopicCloudBrainstormingComponent } from '../_dialogs/topic-cloud-brainstorming/topic-cloud-brainstorming.component';
import { KeycloakRoles, User } from 'app/models/user';
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
import { MultiLevelDialogComponent } from '../_dialogs/multi-level-dialog/multi-level-dialog.component';
import { MULTI_LEVEL_GPT_ROOM_SETTINGS } from '../_dialogs/gpt-room-settings/gpt-room-settings.multi-level';
import { saveSettings } from '../_dialogs/gpt-room-settings/gpt-room-settings.executor';
import { copyCSVString, exportRoom } from 'app/utils/ImportExportMethods';
import { TranslateService } from '@ngx-translate/core';
import { UserRole } from 'app/models/user-roles.enum';
import { NotificationService } from 'app/services/util/notification.service';
import { BonusTokenService } from 'app/services/http/bonus-token.service';
import { Rescale } from 'app/models/rescale';
import { QrCodeDialogComponent } from '../_dialogs/qr-code-dialog/qr-code-dialog.component';
import { PseudonymEditorComponent } from '../_dialogs/pseudonym-editor/pseudonym-editor.component';
import {
  getDefaultHeader,
  getDefaultNavigation,
  getDefaultOptions,
} from 'app/navigation/default-navigation';
import {
  HEADER,
  NAVIGATION,
  OPTIONS,
} from 'modules/navigation/m3-navigation-emitter';
import { clone } from 'app/utils/ts-utils';
import { CommentNotificationDialogComponent } from '../_dialogs/comment-notification-dialog/comment-notification-dialog.component';

export const applyRoomNavigation = (injector: Injector): Observable<void> => {
  return combineLatest([
    getRoomHeader(injector),
    getRoomNavigation(injector),
    getRoomOptions(injector),
  ]).pipe(
    map(([header, navigation, options]) => {
      HEADER.set(header);
      NAVIGATION.set(navigation);
      OPTIONS.set(options);
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
        title: 'Q&A Pseudonym',
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
  ]).pipe(
    map(([template, user, room, assignedRole, currentRole]) => {
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
      template.title = 'Main Menu';
      // Navigation
      const navs: M3NavigationSection[] = [];
      navs.push({
        title: 'Features',
        entries: [
          {
            title: 'Q&A Forum',
            icon: 'forum',
            onClick: () => {
              router.navigate([`/${role}/room/${shortId}/comments`]);
              return true;
            },
            activated: url.endsWith(`/${shortId}/comments/`),
          },
          room?.livepollActive &&
            (room.livepollSession || isMod) && {
              title: 'Blitzumfrage',
              icon: 'flash_on',
              onClick: () => {
                livepoll.open(session);
                return true;
              },
            },
          room?.chatGptActive && {
            title: 'KI Assistenten',
            svgIcon: 'fj_robot',
            onClick: () => {
              router.navigate([`/${role}/room/${shortId}/gpt-chat-room`]);
              return true;
            },
            activated: url.endsWith('/gpt-chat-room/'),
          },
          room?.focusActive && {
            title: 'Fragen-Fokus',
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
            title: 'Fragen-Radar',
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
              title: 'Brainstorming',
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
            title: 'Quiz-Rallye',
            icon: 'quiz',
            onClick: () => {
              router.navigate(['/quiz']);
              return true;
            },
          },
        ].filter(Boolean),
      });
      const hasAdmin =
        isOverview && user.keycloakRoles.includes(KeycloakRoles.AdminDashboard);
      const isRealMod =
        currentRole !== 'Participant' && assignedRole !== currentRole;
      navs.push({
        title: 'Verwaltung',
        entries: [
          isMod && {
            title: 'Moderation',
            icon: 'gavel',
            onClick: () => {
              router.navigate([`/${role}/room/${shortId}/moderator/comments`]);
              return true;
            },
            activated: url.endsWith('/moderator/comments/'),
          },
          hasAdmin && {
            title: 'Administration',
            icon: 'admin_panel_settings',
            onClick: () => {
              router.navigate(['/admin/overview']);
              return true;
            },
          },
          isMod && {
            title: 'Raumverwaltung',
            icon: 'settings',
            onClick: () => {
              router.navigate([`/${role}/room/${shortId}/`]);
              return true;
            },
            activated: isOverview,
          },
          isMod && {
            title: room.questionsBlocked
              ? 'Fragenstellen freigeben'
              : 'Fragenstellen sperren',
            icon: 'comments_disabled',
            onClick: () => {
              saveChanges(
                room.id,
                {
                  questionsBlocked: !room.questionsBlocked,
                },
                injector,
              );
              return true;
            },
          },
          isMod && {
            title: 'Teilnehmeransicht',
            icon: 'groups_3',
            onClick: () => {
              router.navigate([
                `/participant/room/${shortId}${url.substring(urlEndIndex)}`,
              ]);
              return true;
            },
          },
          isRealMod && {
            title: 'Meine Sicht',
            icon: 'groups_3',
            onClick: () => {
              const userRole =
                currentRole === 'Moderator' ? 'moderator' : 'creator';
              router.navigate([
                `/${userRole}/room/${shortId}${url.substring(urlEndIndex)}`,
              ]);
              return true;
            },
          },
          {
            title: 'Per Mail benachrichtigen',
            icon: 'mail',
            onClick: () => {
              openMail(user, room, injector);
              return true;
            },
          },
        ].filter(Boolean),
      });
      if (!isMod) {
        template.sections[0].entries.unshift({
          title: 'Empfang',
          icon: 'checkroom',
          onClick: () => {
            router.navigate([`/${role}/room/${shortId}/`]);
            return true;
          },
          activated: isOverview,
        });
      }
      template.sections.unshift(...navs);
      return template;
    }),
  );
};

export const getRoomOptions = (
  injector: Injector,
): Observable<M3NavigationOptionSection[]> => {
  const accountState = injector.get(AccountStateService);
  const roomState = injector.get(RoomStateService);
  return combineLatest([
    getDefaultOptions(injector),
    accountState.user$.pipe(first((e) => Boolean(e))),
    roomState.room$.pipe(first((e) => Boolean(e))),
    roomState.assignedRole$,
  ]).pipe(
    map(([defaultOpts, user, room, assignedRole]) => {
      const isMod = assignedRole !== 'Participant';
      const options: M3NavigationOptionSection[] = [];
      if (isMod) {
        options.push({
          title: 'Raumeinstellungen',
          options: [
            {
              title: 'Allgemein',
              icon: 'settings_applications',
              options: [
                {
                  title: 'Features',
                  icon: 'settings_suggest',
                  onClick: () => {
                    console.log('Features clicked');
                    return false;
                  },
                },
                {
                  title: 'Moderationsmodus',
                  icon: 'visibility_off',
                  onClick: () => {
                    openModeration(room, injector);
                    return false;
                  },
                },
                {
                  title: 'Forumkonversation',
                  icon: 'forum',
                  onClick: () => {
                    openConversation(room, injector);
                    return false;
                  },
                },
                {
                  title: 'Fragenkategorien',
                  icon: 'sell',
                  onClick: () => {
                    openRoomTags(room, injector);
                    return false;
                  },
                },
                room.bonusArchiveActive &&
                  room.mode !== 'PLE' && {
                    title: 'Bonusarchiv',
                    icon: 'grade',
                    onClick: () => {
                      openBonusArchive(room, injector);
                      return false;
                    },
                  },
                {
                  title: 'Fragen löschen',
                  icon: 'delete_sweep',
                  onClick: () => {
                    openDeleteComments(room, injector);
                    return false;
                  },
                },
                assignedRole === 'Creator' && {
                  title: 'Raum löschen',
                  icon: 'delete',
                  onClick: () => {
                    openDeleteRoom(room, injector);
                    return true;
                  },
                },
              ].filter(Boolean),
            },
            {
              title: 'KI-Einstellungen',
              svgIcon: 'fj_robot',
              onClick: () => {
                openAISettings(room, injector);
                return false;
              },
            },
            {
              title: 'Q&A-Export',
              icon: 'file_download',
              onClick: () => {
                doExport(user, room, injector);
                return true;
              },
            },
            {
              title: 'QR-Code',
              icon: 'qr_code',
              onClick: () => {
                openQr(room, injector);
                return true;
              },
            },
          ],
        });
      }
      options.push(...defaultOpts);
      return options;
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
