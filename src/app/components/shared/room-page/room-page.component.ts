import { Component, ComponentRef, EventEmitter, OnDestroy, OnInit } from '@angular/core';
import { Room } from '../../../models/room';
import { RoomService } from '../../../services/http/room.service';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { WsCommentService } from '../../../services/websockets/ws-comment.service';
import { CommentService } from '../../../services/http/comment.service';
import { EventService } from '../../../services/util/event.service';
import { IMessage, Message } from '@stomp/stompjs';
import { Observable, of, Subscription } from 'rxjs';
import { UserRole } from '../../../models/user-roles.enum';
import { Palette } from '../../../../theme/Theme';
import { ArsObserver } from '../../../../../projects/ars/src/lib/models/util/ars-observer';
import { HeaderService } from '../../../services/util/header.service';
import { ArsComposeService } from '../../../../../projects/ars/src/lib/services/ars-compose.service';
import { User } from '../../../models/user';
import { RoomNameSettingsComponent } from '../../creator/_dialogs/room-name-settings/room-name-settings.component';
import { MatDialog } from '@angular/material/dialog';
import { RoomDescriptionSettingsComponent } from '../../creator/_dialogs/room-description-settings/room-description-settings.component';
import { Export } from '../../../models/export';
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
import { AuthenticationService } from '../../../services/http/authentication.service';
import { ProfanitySettingsComponent } from '../../creator/_dialogs/profanity-settings/profanity-settings.component';
import { SyncFence } from '../../../utils/SyncFence';
import { ModeratorService } from '../../../services/http/moderator.service';

@Component({
  selector: 'app-room-page',
  templateUrl: './room-page.component.html',
  styleUrls: ['./room-page.component.scss']
})
export class RoomPageComponent implements OnInit, OnDestroy {
  room: Room = null;
  user: User = null;
  isLoading = true;
  commentCounter: number;
  urlToCopy = `${window.location.protocol}//${window.location.host}/participant/room/`;
  commentCounterEmit: EventEmitter<number> = new EventEmitter<number>();
  onDestroyListener: EventEmitter<void> = new EventEmitter<void>();
  viewModuleCount = 1;
  moderatorCommentCounter: number;
  deviceType = localStorage.getItem('deviceType');
  userRole: UserRole;
  protected moderationEnabled = true;
  protected sub: Subscription;
  protected commentWatch: Observable<IMessage>;
  protected listenerFn: () => void;
  private _navigationBuild = new SyncFence(3, this.initNavigation.bind(this));

  public constructor(protected roomService: RoomService,
                     protected route: ActivatedRoute,
                     protected location: Location,
                     protected wsCommentService: WsCommentService,
                     protected commentService: CommentService,
                     protected eventService: EventService,
                     protected headerService: HeaderService,
                     protected composeService: ArsComposeService,
                     protected dialog: MatDialog,
                     protected bonusTokenService: BonusTokenService,
                     protected translateService: TranslateService,
                     protected notificationService: NotificationService,
                     protected authenticationService: AuthenticationService,
                     protected moderatorService: ModeratorService
  ) {
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.initializeRoom(params['shortId']);
    });
  }

  ngOnDestroy() {
    this.listenerFn();
    this.eventService.makeFocusOnInputFalse();
    if (this.sub) {
      this.sub.unsubscribe();
    }
    this.onDestroyListener.emit();
  }

  tryInitNavigation() {
    this._navigationBuild.resolveCondition(2);
  }

  initializeRoom(id: string): void {
    this.authenticationService.watchUser.subscribe(user => {
      this.user = user;
      this._navigationBuild.resolveCondition(0);
    });
    this.userRole = this.route.snapshot.data.roles[0];
    this.preRoomLoadHook().subscribe(user => {
      this.roomService.getRoomByShortId(id).subscribe(room => {
        this.room = room;
        this.isLoading = false;
        this.moderationEnabled = !this.room.directSend;
        localStorage.setItem('moderationEnabled', String(this.moderationEnabled));
        if (this.moderationEnabled) {
          this.viewModuleCount = this.viewModuleCount + 1;
        }
        this.commentService.countByRoomId(this.room.id, true).subscribe(commentCounter => {
          this.setCommentCounter(commentCounter);
        });
        if (this.moderationEnabled && this.userRole > UserRole.PARTICIPANT) {
          this.commentService.countByRoomId(this.room.id, false).subscribe(commentCounter => {
            this.moderatorCommentCounter = commentCounter;
          });
        }
        this.commentWatch = this.wsCommentService.getCommentStream(this.room.id);
        this.sub = this.commentWatch.subscribe((message: Message) => {
          const msg = JSON.parse(message.body);
          const payload = msg.payload;
          if (msg.type === 'CommentCreated') {
            this.setCommentCounter(this.commentCounter + 1);
          } else if (msg.type === 'CommentDeleted') {
            this.setCommentCounter(this.commentCounter - 1);
          } else if (msg.type === 'CommentPatched' && this.userRole > UserRole.PARTICIPANT) {
            const ack = payload.changes.ack;
            if (ack === undefined) {
              return;
            }
            if (ack) {
              this.setCommentCounter(this.commentCounter + 1);
              this.moderatorCommentCounter = this.moderatorCommentCounter - 1;
            } else {
              this.setCommentCounter(this.commentCounter - 1);
              this.moderatorCommentCounter = this.moderatorCommentCounter + 1;
            }
          }
        });
        this.postRoomLoadHook();
        this._navigationBuild.resolveCondition(1);
      });
    });
  }

  setCommentCounter(commentCounter: number) {
    this.commentCounter = commentCounter;
    this.commentCounterEmit.emit(this.commentCounter);
  }

  delete(room: Room): void {
    this.roomService.deleteRoom(room.id).subscribe();
    this.location.back();
  }

  editSessionName() {
    console.assert(this.userRole > UserRole.PARTICIPANT);
    const dialogRef = this.dialog.open(RoomNameSettingsComponent, {
      width: '900px',
      maxWidth: 'calc( 100% - 50px )',
      maxHeight: 'calc( 100vh - 50px )',
      autoFocus: false
    });
    dialogRef.componentInstance.editRoom = this.room;
  }

  editSessionDescription() {
    console.assert(this.userRole > UserRole.PARTICIPANT);
    const dialogRef = this.dialog.open(RoomDescriptionSettingsComponent, {
      width: '900px',
      maxWidth: 'calc( 100% - 50px )',
      maxHeight: 'calc( 100vh - 50px )',
      autoFocus: false
    });
    dialogRef.componentInstance.editRoom = this.room;
  }

  exportQuestions() {
    this.moderatorService.get(this.room.id).subscribe(mods => {
      const exp: Export = new Export(
        this.room,
        this.commentService,
        this.bonusTokenService,
        this.translateService,
        'comment-list',
        this.notificationService,
        new Set<string>(mods.map(mod => mod.accountId)),
        this.user
      );
      exp.exportAsCsv();
    });
  }

  deleteQuestions() {
    console.assert(this.userRole > UserRole.PARTICIPANT);
    const dialogRef = this.dialog.open(DeleteCommentsComponent, {
      width: '400px'
    });
    dialogRef.componentInstance.roomId = this.room.id;
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'delete') {
        this.translateService.get('room-page.comments-deleted').subscribe(msg => {
          this.notificationService.show(msg);
        });
        this.commentService.deleteCommentsByRoomId(this.room.id).subscribe();
      }
    });
  }

  openDeleteRoomDialog(): void {
    console.assert(this.userRole === UserRole.CREATOR);
    const dialogRef = this.dialog.open(RoomDeleteComponent, {
      width: '400px'
    });
    dialogRef.componentInstance.room = this.room;
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'delete') {
        this.deleteRoom();
      }
    });
  }

  deleteRoom(): void {
    console.assert(this.userRole === UserRole.CREATOR);
    this.translateService.get('room-page.deleted').subscribe(msg => {
      this.notificationService.show(this.room.name + msg);
    });
    this.roomService.deleteRoom(this.room.id).subscribe(result => {
      const event = new RoomDeleted(this.room.id);
      this.eventService.broadcast(event.type, event.payload);
      this.location.back();
    });
  }

  copyShortId(): void {
    console.assert(this.userRole > UserRole.PARTICIPANT);
    navigator.clipboard.writeText(`${this.urlToCopy}${this.room.shortId}`).then(() => {
      this.translateService.get('room-page.session-id-copied').subscribe(msg => {
        this.notificationService.show(msg, '', { duration: 2000 });
      });
    }, () => {
      console.log('Clipboard write failed.');
    });

  }

  showModeratorsDialog(): void {
    console.assert(this.userRole > UserRole.PARTICIPANT);
    const dialogRef = this.dialog.open(ModeratorsComponent, {
      width: '400px'
    });
    dialogRef.componentInstance.roomId = this.room.id;
  }

  showBonusTokenDialog(): void {
    console.assert(this.userRole > UserRole.PARTICIPANT);
    const dialogRef = this.dialog.open(BonusTokenComponent, {
      width: '400px'
    });
    dialogRef.componentInstance.room = this.room;
  }

  showCommentsDialog(): void {
    console.assert(this.userRole > UserRole.PARTICIPANT);
    const updRoom = JSON.parse(JSON.stringify(this.room));

    const dialogRef = this.dialog.open(CommentSettingsComponent, {
      width: '400px'
    });
    dialogRef.componentInstance.roomId = this.room.id;
    dialogRef.componentInstance.editRoom = updRoom;
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'abort') {
        return;
      } else {
        if (result instanceof CommentSettingsDialog) {
          this.updateCommentSettings(result);
          this.saveChanges(updRoom);
        }
      }
    });
    dialogRef.backdropClick().subscribe(res => {
      dialogRef.close('abort');
    });
  }

  updateCommentSettings(settings: CommentSettingsDialog) {
    this.room.tags = settings.tags;

    if (this.moderationEnabled && settings.directSend) {
      this.viewModuleCount = this.viewModuleCount - 1;
    } else if (!this.moderationEnabled && !settings.directSend) {
      this.viewModuleCount = this.viewModuleCount + 1;
    }

    this.moderationEnabled = !settings.directSend;
    localStorage.setItem('moderationEnabled', String(this.moderationEnabled));
  }

  showTagsDialog(): void {
    console.assert(this.userRole > UserRole.PARTICIPANT);
    const updRoom = JSON.parse(JSON.stringify(this.room));
    const dialogRef = this.dialog.open(TagsComponent, {
      width: '400px'
    });
    let tags = [];
    if (this.room.tags !== undefined) {
      tags = this.room.tags;
    }
    dialogRef.componentInstance.tags = tags;
    dialogRef.afterClosed().subscribe(result => {
      if (!result || result === 'abort') {
        return;
      } else {
        updRoom.tags = result;
        this.saveChanges(updRoom);
      }
    });
  }

  toggleProfanityFilter() {
    console.assert(this.userRole > UserRole.PARTICIPANT);
    const dialogRef = this.dialog.open(ProfanitySettingsComponent, {
      width: '400px'
    });
    dialogRef.componentInstance.editRoom = this.room;
  }

  protected preRoomLoadHook(): Observable<any> {
    return of('');
  }

  protected postRoomLoadHook() {
  }

  protected saveChanges(updRoom: Room) {
    this.roomService.updateRoom(updRoom).subscribe((room) => {
        this.room = room;
        this.translateService.get('room-page.changes-successful').subscribe(msg => {
          this.notificationService.show(msg);
        });
      },
      error => {
        this.translateService.get('room-page.changes-gone-wrong').subscribe(msg => {
          this.notificationService.show(msg);
        });
      });
  }

  private initNavigation() {
    /* eslint-disable @typescript-eslint/no-shadow */
    const list: ComponentRef<any>[] = this.composeService.builder(this.headerService.getHost(), e => {
      e.menuItem({
        translate: this.headerService.getTranslate(),
        icon: 'article',
        class: 'material-icons-outlined',
        text: 'header.edit-session-description',
        callback: () => this.editSessionDescription(),
        condition: () => this.userRole > UserRole.PARTICIPANT
      });
      e.menuItem({
        translate: this.headerService.getTranslate(),
        icon: 'visibility_off',
        class: 'material-icons-outlined',
        isSVGIcon: false,
        text: 'header.moderation-mode',
        callback: () => this.showCommentsDialog(),
        condition: () => this.userRole > UserRole.PARTICIPANT
      });
      e.menuItem({
        translate: this.headerService.getTranslate(),
        icon: 'gavel',
        class: 'material-icons-outlined',
        text: 'header.edit-moderator',
        callback: () => this.showModeratorsDialog(),
        condition: () => this.userRole > UserRole.PARTICIPANT
      });
      e.menuItem({
        translate: this.headerService.getTranslate(),
        icon: 'comment_tag',
        class: 'material-icons-outlined',
        isSVGIcon: true,
        text: 'header.edit-tags',
        callback: () => this.showTagsDialog(),
        condition: () => this.userRole > UserRole.PARTICIPANT
      });
      e.menuItem({
        translate: this.headerService.getTranslate(),
        icon: 'grade',
        class: 'material-icons-outlined',
        iconColor: Palette.YELLOW,
        text: 'header.bonustoken',
        callback: () => this.showBonusTokenDialog(),
        condition: () => this.userRole > UserRole.PARTICIPANT
      });
      e.menuItem({
        translate: this.headerService.getTranslate(),
        icon: 'file_download',
        class: 'material-icons-outlined',
        text: 'header.export-questions',
        callback: () => this.exportQuestions(),
        condition: () => this.userRole >= UserRole.PARTICIPANT
      });
      e.menuItem({
        translate: this.headerService.getTranslate(),
        icon: 'password',
        class: 'material-icons-outlined',
        text: 'header.profanity-filter',
        callback: () => this.toggleProfanityFilter(),
        condition: () => this.userRole > UserRole.PARTICIPANT
      });
      e.menuItem({
        translate: this.headerService.getTranslate(),
        icon: 'delete_sweep',
        class: 'material-icons-outlined',
        iconColor: Palette.RED,
        text: 'header.delete-questions',
        callback: () => this.deleteQuestions(),
        condition: () => this.userRole > UserRole.PARTICIPANT
      });
      e.menuItem({
        translate: this.headerService.getTranslate(),
        icon: 'delete',
        class: 'material-icons-outlined',
        iconColor: Palette.RED,
        isSVGIcon: false,
        text: 'header.delete-room',
        callback: () => this.openDeleteRoomDialog(),
        condition: () => this.userRole === UserRole.CREATOR
      });
      e.altToggle(
        {
          translate: this.headerService.getTranslate(),
          text: 'header.block',
          icon: 'comments_disabled',
          class: 'material-icons-outlined',
          iconColor: Palette.RED,
          color: Palette.RED
        },
        {
          translate: this.headerService.getTranslate(),
          text: 'header.unlock',
          icon: 'comments_disabled',
          class: 'material-icons-outlined',
          iconColor: Palette.RED
        },
        ArsObserver.build<boolean>(e => {
          e.set(this.room.questionsBlocked);
          e.onChange(a => {
            this.room.questionsBlocked = a.get();
            this.roomService.updateRoom(this.room).subscribe();
            if (a.get()) {
              this.headerService.getTranslate().get('header.questions-blocked').subscribe(msg => {
                this.headerService.getNotificationService().show(msg);
              });
            }
          });
        })
        ,
        () => this.userRole > UserRole.PARTICIPANT
      );
    });
    this.onDestroyListener.subscribe(() => {
      list.forEach(e => e.destroy());
    });
    /* eslint-enable @typescript-eslint/no-shadow */
  }

}
