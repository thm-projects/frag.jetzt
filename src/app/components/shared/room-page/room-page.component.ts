import { Component, ComponentRef, EventEmitter, OnDestroy, OnInit } from '@angular/core';
import { Room } from '../../../models/room';
import { RoomService } from '../../../services/http/room.service';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { CommentService } from '../../../services/http/comment.service';
import { EventService } from '../../../services/util/event.service';
import { Observable, of, Subscription } from 'rxjs';
import { UserRole } from '../../../models/user-roles.enum';
import { Palette } from '../../../../theme/Theme';
import { ArsObserver } from '../../../../../projects/ars/src/lib/models/util/ars-observer';
import { HeaderService } from '../../../services/util/header.service';
import { ArsComposeService } from '../../../../../projects/ars/src/lib/services/ars-compose.service';
import { User } from '../../../models/user';
import { RoomNameSettingsComponent } from '../../creator/_dialogs/room-name-settings/room-name-settings.component';
import { MatDialog } from '@angular/material/dialog';
import {
  RoomDescriptionSettingsComponent
} from '../../creator/_dialogs/room-description-settings/room-description-settings.component';
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
import {
  copyCSVString,
  exportRoom,
  ImportQuestionsResult,
  importToRoom,
  uploadCSV
} from '../../../utils/ImportExportMethods';
import { SessionService } from '../../../services/util/session.service';
import { RoomDataService } from '../../../services/util/room-data.service';
import { mergeMap } from 'rxjs/operators';
import {
  CommentNotificationDialogComponent
} from '../_dialogs/comment-notification-dialog/comment-notification-dialog.component';

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
  userRole: UserRole;
  protected moderationEnabled = true;
  protected listenerFn: () => void;
  private _navigationBuild = new SyncFence(2, this.initNavigation.bind(this));
  private _sub: Subscription;
  private _list: ComponentRef<any>[];

  public constructor(
    protected roomService: RoomService,
    protected route: ActivatedRoute,
    protected location: Location,
    protected commentService: CommentService,
    protected eventService: EventService,
    protected headerService: HeaderService,
    protected composeService: ArsComposeService,
    protected dialog: MatDialog,
    protected bonusTokenService: BonusTokenService,
    protected translateService: TranslateService,
    protected notificationService: NotificationService,
    protected authenticationService: AuthenticationService,
    protected sessionService: SessionService,
    protected roomDataService: RoomDataService,
  ) {
  }

  ngOnInit() {
    this.initializeRoom();
  }

  ngOnDestroy() {
    this.listenerFn();
    this.eventService.makeFocusOnInputFalse();
    this._list?.forEach(e => e.destroy());
    this._sub?.unsubscribe();
  }

  tryInitNavigation() {
    this._navigationBuild.resolveCondition(1);
  }

  initializeRoom(): void {
    this.authenticationService.watchUser.subscribe(user => {
      this.user = user;
    });
    this.userRole = this.route.snapshot.data.roles[0];
    this.preRoomLoadHook().subscribe(user => {
      this.sessionService.getRoomOnce().subscribe(room => {
        this.room = room;
        this.isLoading = false;
        this.moderationEnabled = !this.room.directSend;
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
        const sub = this.roomDataService.receiveUpdates([
          { type: 'CommentCreated', finished: true },
          { type: 'CommentDeleted', finished: true },
          { type: 'CommentPatched', finished: true, updates: ['ack'] }
        ]).subscribe(update => {
          if (update.type === 'CommentCreated') {
            this.setCommentCounter(this.commentCounter + 1);
          } else if (update.type === 'CommentDeleted') {
            this.setCommentCounter(this.commentCounter - 1);
          } else if (update.type === 'CommentPatched') {
            if (update.comment.ack) {
              this.setCommentCounter(this.commentCounter + 1);
              this.moderatorCommentCounter = this.moderatorCommentCounter - 1;
            } else {
              this.setCommentCounter(this.commentCounter - 1);
              this.moderatorCommentCounter = this.moderatorCommentCounter + 1;
            }
          }
        });
        this.onDestroyListener.subscribe(() => sub.unsubscribe());
        this.postRoomLoadHook();
        this._navigationBuild.resolveCondition(0);
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
    this.sessionService.getModeratorsOnce().subscribe(mods => {
      exportRoom(this.translateService,
        this.notificationService,
        this.bonusTokenService,
        this.commentService,
        'room-export',
        this.user,
        this.room,
        new Set<string>(mods.map(mod => mod.accountId))
      ).subscribe(text => {
        copyCSVString(text[0], this.room.name + '-' + this.room.shortId + '-' + text[1] + '.csv');
      });
    });
  }

  importQuestions(): Observable<ImportQuestionsResult> {
    return uploadCSV().pipe(
      mergeMap(data => {
        if (!data) {
          return of(null);
        }
        return importToRoom(this.translateService,
          this.room.id,
          this.roomService,
          this.commentService,
          'comment-list',
          data);
      })
    );
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

  openEmailNotification(): void {
    const dialogRef = this.dialog.open(CommentNotificationDialogComponent, {
      minWidth: '80%'
    });
    dialogRef.componentInstance.room = this.room;
  }

  deleteRoom(): void {
    console.assert(this.userRole === UserRole.CREATOR);
    this.translateService.get('room-page.deleted').subscribe(msg => {
      this.notificationService.show(this.room.name + msg);
    });
    this.roomService.deleteRoom(this.room.id).subscribe(result => {
      const event = new RoomDeleted(this.room.id);
      this.eventService.broadcast(event.type, event.payload);
      this.authenticationService.removeAccess(this.room.shortId);
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
    dialogRef.componentInstance.isCreator = this.sessionService.currentRole === 3;
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
    this._list = this.composeService.builder(this.headerService.getHost(), e => {
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
        icon: 'sell',
        class: 'material-icons-outlined',
        isSVGIcon: false,
        text: 'header.edit-tags',
        callback: () => this.showTagsDialog(),
        condition: () => this.userRole > UserRole.PARTICIPANT
      });
      e.menuItem({
        translate: this.headerService.getTranslate(),
        icon: 'grade',
        class: 'material-icons-round',
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
        icon: 'file_upload',
        class: 'material-icons-outlined',
        text: 'header.import-questions',
        callback: () => this.importQuestions().subscribe(),
        condition: () => (this.roomDataService.getCurrentRoomData()?.length || 0) +
          (this.roomDataService.getCurrentRoomData(true)?.length || 0) === 0 &&
          this.user.id === this.room.ownerId,
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
      e.menuItem({
        translate: this.headerService.getTranslate(),
        icon: 'email',
        class: 'material-icons-outlined',
        iconColor: Palette.YELLOW,
        isSVGIcon: false,
        text: 'room-list.email-notification',
        callback: () => this.openEmailNotification(),
        condition: () => !!this.user?.loginId
      });
    });
    /* eslint-enable @typescript-eslint/no-shadow */
  }

}
