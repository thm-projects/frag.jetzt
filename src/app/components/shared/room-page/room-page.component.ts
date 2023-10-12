import {
  Component,
  ComponentRef,
  EventEmitter,
  Injector,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { Room } from '../../../models/room';
import { RoomPatch, RoomService } from '../../../services/http/room.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { CommentService } from '../../../services/http/comment.service';
import { EventService } from '../../../services/util/event.service';
import { Observable, of, ReplaySubject, Subscription, tap } from 'rxjs';
import { UserRole } from '../../../models/user-roles.enum';
import { Palette } from '../../../../theme/Theme';
import { ArsObserver } from '../../../../../projects/ars/src/lib/models/util/ars-observer';
import { HeaderService } from '../../../services/util/header.service';
import { ArsComposeService } from '../../../../../projects/ars/src/lib/services/ars-compose.service';
import { RoomNameSettingsComponent } from '../../creator/_dialogs/room-name-settings/room-name-settings.component';
import { MatDialog } from '@angular/material/dialog';
import { RoomDescriptionSettingsComponent } from '../../creator/_dialogs/room-description-settings/room-description-settings.component';
import { BonusTokenService } from '../../../services/http/bonus-token.service';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService } from '../../../services/util/notification.service';
import { DeleteCommentsComponent } from '../../creator/_dialogs/delete-comments/delete-comments.component';
import { RoomDeleteComponent } from '../../creator/_dialogs/room-delete/room-delete.component';
import { RoomDeleted } from '../../../models/events/room-deleted';
import { ModeratorsComponent } from '../../creator/_dialogs/moderators/moderators.component';
import { BonusTokenComponent } from '../../creator/_dialogs/bonus-token/bonus-token.component';
import { CommentSettingsComponent } from '../../creator/_dialogs/comment-settings/comment-settings.component';
import { CommentSettingsDialog } from '../../../models/comment-settings-dialog';
import { TagsComponent } from '../../creator/_dialogs/tags/tags.component';
import { ProfanitySettingsComponent } from '../../creator/_dialogs/profanity-settings/profanity-settings.component';
import { SyncFence } from '../../../utils/SyncFence';
import {
  copyCSVString,
  exportRoom,
  ImportQuestionsResult,
  importToRoom,
  uploadCSV,
} from '../../../utils/ImportExportMethods';
import { SessionService } from '../../../services/util/session.service';
import { RoomDataService } from '../../../services/util/room-data.service';
import { mergeMap, takeUntil } from 'rxjs/operators';
import { ToggleConversationComponent } from '../../creator/_dialogs/toggle-conversation/toggle-conversation.component';
import { QuillUtils } from '../../../utils/quill-utils';
import { TitleService } from '../../../services/util/title.service';
import { RoomSettingsOverviewComponent } from '../_dialogs/room-settings-overview/room-settings-overview.component';
import { GptRoomSettingsComponent } from '../_dialogs/gpt-room-settings/gpt-room-settings.component';
import { User } from 'app/models/user';
import { DeviceStateService } from 'app/services/state/device-state.service';
import { AccountStateService } from 'app/services/state/account-state.service';
import {
  ROOM_ROLE_MAPPER,
  RoomStateService,
} from 'app/services/state/room-state.service';

@Component({
  selector: 'app-room-page',
  templateUrl: './room-page.component.html',
  styleUrls: ['./room-page.component.scss'],
})
export class RoomPageComponent implements OnInit, OnDestroy {
  room: Room = null;
  user: User = null;
  isLoading = true;
  commentCounter: number;
  responseCounter: number;
  urlToCopy = `${window.location.protocol}//${window.location.host}/participant/room/`;
  onDestroyListener: EventEmitter<void> = new EventEmitter<void>();
  moderatorCommentCounter: number;
  moderatorResponseCounter: number;
  userRole: UserRole;
  moderationEnabled = true;
  protected deviceState = inject(DeviceStateService);
  protected accountState = inject(AccountStateService);
  protected listenerFn: () => void;
  protected roomService: RoomService;
  protected route: ActivatedRoute;
  protected location: Location;
  protected commentService: CommentService;
  protected eventService: EventService;
  protected headerService: HeaderService;
  protected composeService: ArsComposeService;
  protected dialog: MatDialog;
  protected bonusTokenService: BonusTokenService;
  protected translateService: TranslateService;
  protected notificationService: NotificationService;
  protected sessionService: SessionService;
  protected roomDataService: RoomDataService;
  protected titleService: TitleService;
  protected router: Router;
  protected roomState: RoomStateService;
  protected destroyer = new ReplaySubject(1);
  private _navigationBuild = new SyncFence(2, this.initNavigation.bind(this));
  private _sub: Subscription;
  private _list: ComponentRef<any>[];

  constructor(protected injector: Injector) {
    this.roomService = injector.get(RoomService);
    this.route = injector.get(ActivatedRoute);
    this.location = injector.get(Location);
    this.commentService = injector.get(CommentService);
    this.eventService = injector.get(EventService);
    this.headerService = injector.get(HeaderService);
    this.composeService = injector.get(ArsComposeService);
    this.dialog = injector.get(MatDialog);
    this.bonusTokenService = injector.get(BonusTokenService);
    this.translateService = injector.get(TranslateService);
    this.notificationService = injector.get(NotificationService);
    this.sessionService = injector.get(SessionService);
    this.roomDataService = injector.get(RoomDataService);
    this.titleService = injector.get(TitleService);
    this.router = injector.get(Router);
    this.roomState = injector.get(RoomStateService);
  }

  ngOnInit() {
    this.initializeRoom();
  }

  ngOnDestroy() {
    this.listenerFn();
    this.eventService.makeFocusOnInputFalse();
    this._list?.forEach((e) => e.destroy());
    this._sub?.unsubscribe();
    this.titleService.resetTitle();
  }

  tryInitNavigation() {
    this._navigationBuild.resolveCondition(1);
  }

  initializeRoom(): void {
    this.accountState.user$
      .pipe(takeUntil(this.destroyer))
      .subscribe((user) => {
        this.user = user;
      });
    this.userRole = this.route.snapshot.data.roles[0];
    this.preRoomLoadHook().subscribe(() => {
      this.sessionService.getRoomOnce().subscribe((room) => {
        this.room = room;
        this.isLoading = false;
        this.moderationEnabled = !this.room.directSend;
        const roomSub = this.sessionService
          .receiveRoomUpdates()
          .subscribe((updRoom) => {
            this.moderationEnabled = !updRoom.directSend;
            this.updateResponseCounter();
          });
        this.onDestroyListener.subscribe(() => roomSub.unsubscribe());
        this.updateResponseCounter();
        const sub = this.roomDataService.dataAccessor
          .receiveUpdates([
            { type: 'CommentCreated', finished: true },
            { type: 'CommentDeleted', finished: true },
            { type: 'CommentPatched', finished: true, updates: ['ack'] },
          ])
          .subscribe(() => {
            this.updateResponseCounter();
          });
        this.onDestroyListener.subscribe(() => sub.unsubscribe());
        this.postRoomLoadHook();
        this._navigationBuild.resolveCondition(0);
      });
    });
  }

  setCommentCounter(commentCounter: number, responseCounter: number) {
    this.commentCounter = commentCounter;
    this.responseCounter = responseCounter;
    this.titleService.attachTitle(`(${commentCounter} / ${responseCounter})`);
  }

  editSessionName() {
    console.assert(this.userRole > UserRole.PARTICIPANT);
    const dialogRef = this.dialog.open(RoomNameSettingsComponent, {
      width: '900px',
      maxWidth: 'calc( 100% - 50px )',
      maxHeight: 'calc( 100vh - 50px )',
      autoFocus: false,
    });
    dialogRef.componentInstance.editRoom = this.room;
  }

  editSessionDescription() {
    console.assert(this.userRole > UserRole.PARTICIPANT);
    const dialogRef = this.dialog.open(RoomDescriptionSettingsComponent, {
      width: '900px',
      maxWidth: 'calc( 100% - 50px )',
      maxHeight: 'calc( 100vh - 50px )',
      autoFocus: false,
    });
    dialogRef.componentInstance.editRoom = this.room;
  }

  exportQuestions() {
    this.sessionService.getModeratorsOnce().subscribe((mods) => {
      exportRoom(
        this.translateService,
        ROOM_ROLE_MAPPER[this.roomState.getCurrentRole()] ||
          UserRole.PARTICIPANT,
        this.notificationService,
        this.bonusTokenService,
        this.commentService,
        'room-export',
        this.user,
        this.room,
        new Set<string>(mods.map((mod) => mod.accountId)),
      ).subscribe((text) => {
        copyCSVString(
          text[0],
          this.room.name + '-' + this.room.shortId + '-' + text[1] + '.csv',
        );
      });
    });
  }

  importQuestions(): Observable<ImportQuestionsResult> {
    return uploadCSV().pipe(
      mergeMap((data) => {
        if (!data) {
          return of(null);
        }
        return importToRoom(
          this.translateService,
          ROOM_ROLE_MAPPER[this.roomState.getCurrentRole()] ||
            UserRole.PARTICIPANT,
          this.room.id,
          this.roomService,
          this.commentService,
          'room-export',
          data,
        );
      }),
      tap((_) => {
        const url = decodeURI(this.router.url);
        this.router.navigate(['/']).then(() => {
          setTimeout(() => this.router.navigate([url]));
        });
      }),
    );
  }

  deleteQuestions() {
    console.assert(this.userRole > UserRole.PARTICIPANT);
    const dialogRef = this.dialog.open(DeleteCommentsComponent, {
      width: '400px',
    });
    dialogRef.componentInstance.roomId = this.room.id;
    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'delete') {
        this.translateService
          .get('room-page.comments-deleted')
          .subscribe((msg) => {
            this.notificationService.show(msg);
          });
        this.commentService.deleteCommentsByRoomId(this.room.id).subscribe();
      }
    });
  }

  showToggleConversationDialog() {
    const dialogRef = this.dialog.open(ToggleConversationComponent, {
      width: '600px',
      data: {
        conversationDepth: this.room.conversationDepth,
        directSend: this.room.directSend,
      },
    });
    dialogRef.componentInstance.editorRoom = this.room;
    dialogRef.afterClosed().subscribe((result) => {
      if (typeof result === 'number') {
        this.roomService
          .patchRoom(this.room.id, {
            conversationDepth: result,
          })
          .subscribe();
      }
    });
  }

  openDeleteRoomDialog(): void {
    console.assert(this.userRole === UserRole.CREATOR);
    const dialogRef = this.dialog.open(RoomDeleteComponent, {
      width: '400px',
    });
    dialogRef.componentInstance.room = this.room;
    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'delete') {
        this.deleteRoom();
      }
    });
  }

  deleteRoom(): void {
    console.assert(this.userRole === UserRole.CREATOR);
    this.roomService.deleteRoom(this.room.id).subscribe({
      next: () => {
        const event = new RoomDeleted(this.room.id);
        this.eventService.broadcast(event.type, event.payload);
        this.accountState.removeAccess(this.room.shortId);
        this.router.navigate(['/user']).then(() => {
          this.translateService.get('room-page.deleted').subscribe((msg) => {
            this.notificationService.show(this.room.name + msg);
          });
        });
      },
      error: () => {
        this.translateService
          .get('room-page.deleted-error')
          .subscribe((msg) => {
            this.notificationService.show(msg);
          });
      },
    });
  }

  copyShortId(): void {
    console.assert(this.userRole > UserRole.PARTICIPANT);
    navigator.clipboard.writeText(`${this.urlToCopy}${this.room.shortId}`).then(
      () => {
        this.translateService
          .get('room-page.session-id-copied')
          .subscribe((msg) => {
            this.notificationService.show(msg, '', { duration: 2000 });
          });
      },
      () => {
        console.log('Clipboard write failed.');
      },
    );
  }

  showModeratorsDialog(): void {
    console.assert(this.userRole > UserRole.PARTICIPANT);
    const dialogRef = this.dialog.open(ModeratorsComponent, {
      width: '400px',
    });
    dialogRef.componentInstance.roomId = this.room.id;
    dialogRef.componentInstance.isCreator =
      this.roomState.getCurrentAssignedRole() === 'Creator';
  }

  showBonusTokenDialog(): void {
    console.assert(this.userRole > UserRole.PARTICIPANT);
    const dialogRef = this.dialog.open(BonusTokenComponent, {
      width: '400px',
    });
    dialogRef.componentInstance.room = this.room;
  }

  showCommentsDialog(): void {
    console.assert(this.userRole > UserRole.PARTICIPANT);
    const dialogRef = this.dialog.open(CommentSettingsComponent, {
      width: '400px',
    });
    dialogRef.componentInstance.editRoom = this.room;
    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'abort') {
        return;
      } else if (result instanceof CommentSettingsDialog) {
        this.saveChanges({
          threshold: result.threshold,
          directSend: result.directSend,
        });
      }
    });
    dialogRef.backdropClick().subscribe((res) => {
      dialogRef.close('abort');
    });
  }

  showTagsDialog(): void {
    console.assert(this.userRole > UserRole.PARTICIPANT);
    const dialogRef = this.dialog.open(TagsComponent, {
      width: '400px',
    });
    const tags = [...(this.room.tags || [])];
    const tagsBefore = [...tags];
    dialogRef.componentInstance.tags = tags;
    dialogRef.afterClosed().subscribe((result) => {
      if (
        !result ||
        result === 'abort' ||
        !this.hasTagChanges(tagsBefore, result)
      ) {
        return;
      } else {
        this.saveChanges({ tags: result });
      }
    });
  }

  hasTagChanges(before: string[], after: string[]): boolean {
    if (before.length !== after.length) {
      return true;
    }
    return before.some((tag) => !after.includes(tag));
  }

  toggleProfanityFilter() {
    console.assert(this.userRole > UserRole.PARTICIPANT);
    const dialogRef = this.dialog.open(ProfanitySettingsComponent, {
      width: '400px',
    });
    dialogRef.componentInstance.editRoom = this.room;
  }

  protected isMobile() {
    return this.deviceState.isMobile();
  }

  protected preRoomLoadHook(): Observable<any> {
    return of('');
  }

  protected postRoomLoadHook() {}

  protected saveChanges(data: Partial<Room>) {
    const description = data?.description
      ? QuillUtils.serializeDelta(data.description)
      : null;
    const obj: RoomPatch = (
      description ? { ...data, description } : { ...data }
    ) as RoomPatch;
    this.roomService.patchRoom(this.room.id, obj).subscribe({
      next: (room) => {
        this.translateService
          .get('room-page.changes-successful')
          .subscribe((msg) => {
            this.notificationService.show(msg);
          });
      },
      error: (error) => {
        this.translateService
          .get('room-page.changes-gone-wrong')
          .subscribe((msg) => {
            this.notificationService.show(msg);
          });
      },
    });
  }

  private updateResponseCounter(): void {
    this.commentService
      .countByRoomId([
        { roomId: this.room.id, ack: true },
        { roomId: this.room.id, ack: false },
      ])
      .subscribe((commentCounter) => {
        this.setCommentCounter(
          commentCounter[0].questionCount,
          commentCounter[0].responseCount,
        );
        if (!this.room.directSend && this.userRole > UserRole.PARTICIPANT) {
          this.moderatorCommentCounter = commentCounter[1].questionCount;
          this.moderatorResponseCounter = commentCounter[1].responseCount;
        }
      });
  }

  private initNavigation() {
    this._list = this.composeService.builder(
      this.headerService.getHost(),
      (e) => {
        e.menuItem({
          translate: this.headerService.getTranslate(),
          icon: '',
          class: 'chatgpt-robot-icon settings',
          text: 'header.gpt-settings',
          callback: () => {
            GptRoomSettingsComponent.open(
              this.dialog,
              this.room,
              this.userRole,
            );
          },
          condition: () => this.userRole > UserRole.PARTICIPANT,
        });
        e.menuItem({
          translate: this.headerService.getTranslate(),
          icon: 'room_preferences',
          class: 'material-icons-round settings',
          text: 'room-list.settings-overview',
          callback: () => {
            const ref = this.dialog.open(RoomSettingsOverviewComponent, {
              width: '600px',
            });
            ref.componentInstance.room = this.room;
          },
          condition: () => this.userRole > UserRole.PARTICIPANT,
        });
        e.menuItem({
          translate: this.headerService.getTranslate(),
          icon: 'visibility_off',
          class: 'material-icons-outlined',
          isSVGIcon: false,
          text: 'header.moderation-mode',
          callback: () => this.showCommentsDialog(),
          condition: () => this.userRole > UserRole.PARTICIPANT,
        });
        e.menuItem({
          translate: this.headerService.getTranslate(),
          icon: 'forum',
          class: 'material-icons-outlined',
          isSVGIcon: false,
          text: 'header.conversation',
          callback: () => this.showToggleConversationDialog(),
          condition: () => this.userRole > UserRole.PARTICIPANT,
        });
        e.menuItem({
          translate: this.headerService.getTranslate(),
          icon: 'sell',
          class: 'material-icons-outlined',
          isSVGIcon: false,
          text: 'header.edit-tags',
          callback: () => this.showTagsDialog(),
          condition: () => this.userRole > UserRole.PARTICIPANT,
        });
        e.menuItem({
          translate: this.headerService.getTranslate(),
          icon: 'grade',
          class: 'material-icons-round',
          iconColor: Palette.YELLOW,
          text: 'header.bonustoken',
          callback: () => this.showBonusTokenDialog(),
          condition: () =>
            this.userRole > UserRole.PARTICIPANT &&
            this.room?.bonusArchiveActive,
        });
        e.menuItem({
          translate: this.headerService.getTranslate(),
          icon: 'file_download',
          class: 'material-icons-outlined',
          text: 'header.export-questions',
          callback: () => this.exportQuestions(),
          condition: () => this.userRole >= UserRole.PARTICIPANT,
        });
        e.menuItem({
          translate: this.headerService.getTranslate(),
          icon: 'file_upload',
          class: 'material-icons-outlined',
          text: 'header.import-questions',
          callback: () => this.importQuestions().subscribe(),
          condition: () =>
            (this.roomDataService.dataAccessor.currentRawComments()?.length ||
              0) +
              (this.roomDataService.moderatorDataAccessor.currentRawComments()
                ?.length || 0) ===
              0 &&
            this.user.id === this.room.ownerId &&
            this.userRole > UserRole.PARTICIPANT,
        });
        e.menuItem({
          translate: this.headerService.getTranslate(),
          icon: 'waving_hand',
          class: 'material-icons-outlined',
          text: 'header.edit-session-description',
          callback: () => this.editSessionDescription(),
          condition: () => this.userRole > UserRole.PARTICIPANT,
        });
        e.altToggle(
          {
            translate: this.headerService.getTranslate(),
            text: 'header.block',
            icon: 'comments_disabled',
            class: 'material-icons-outlined',
            iconColor: Palette.RED,
            color: Palette.RED,
          },
          {
            translate: this.headerService.getTranslate(),
            text: 'header.unlock',
            icon: 'comments_disabled',
            class: 'material-icons-outlined',
            iconColor: Palette.RED,
          },
          ArsObserver.build<boolean>((ev) => {
            ev.set(this.room.questionsBlocked);
            ev.onChange((a) => {
              this.roomService
                .patchRoom(this.room.id, { questionsBlocked: a.get() })
                .subscribe();
              if (a.get()) {
                this.headerService
                  .getTranslate()
                  .get('header.questions-blocked')
                  .subscribe((msg) => {
                    this.headerService.getNotificationService().show(msg);
                  });
              }
            });
          }),
          () => this.userRole > UserRole.PARTICIPANT,
        );
        e.menuItem({
          translate: this.headerService.getTranslate(),
          icon: 'delete_sweep',
          class: 'material-icons-outlined',
          iconColor: Palette.RED,
          text: 'header.delete-questions',
          callback: () => this.deleteQuestions(),
          condition: () => this.userRole > UserRole.PARTICIPANT,
        });
        e.menuItem({
          translate: this.headerService.getTranslate(),
          icon: 'delete',
          class: 'material-icons-outlined',
          iconColor: Palette.RED,
          isSVGIcon: false,
          text: 'header.delete-room',
          callback: () => this.openDeleteRoomDialog(),
          condition: () => this.userRole === UserRole.CREATOR,
        });
      },
    );
  }
}
