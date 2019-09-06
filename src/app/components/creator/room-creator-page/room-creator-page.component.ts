import { Component, OnInit } from '@angular/core';
import { RoomService } from '../../../services/http/room.service';
import { ActivatedRoute } from '@angular/router';
import { RoomPageComponent } from '../../shared/room-page/room-page.component';
import { Room } from '../../../models/room';
import { CommentSettingsDialog } from '../../../models/comment-settings-dialog';
import { Location } from '@angular/common';
import { NotificationService } from '../../../services/util/notification.service';
import { MatDialog } from '@angular/material';
import { RoomEditComponent } from '../_dialogs/room-edit/room-edit.component';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/util/language.service';
import { TSMap } from 'typescript-map';
import { WsCommentServiceService } from '../../../services/websockets/ws-comment-service.service';
import { CommentService } from '../../../services/http/comment.service';
import { ModeratorsComponent } from '../_dialogs/moderators/moderators.component';
import { CommentSettingsComponent } from '../_dialogs/comment-settings/comment-settings.component';
import { LiveAnnouncer } from '@angular/cdk/a11y';

@Component({
  selector: 'app-room-creator-page',
  templateUrl: './room-creator-page.component.html',
  styleUrls: ['./room-creator-page.component.scss']
})
export class RoomCreatorPageComponent extends RoomPageComponent implements OnInit {
  room: Room;
  updRoom: Room;
  commentThreshold: number;
  updCommentThreshold: number;
  deviceType = localStorage.getItem('deviceType');
  viewModuleCount = 1;
  moderatorCommentCounter: number;
  urlToCopy = 'https://frag.jetzt/participant/room/';

  constructor(protected roomService: RoomService,
              protected notification: NotificationService,
              protected route: ActivatedRoute,
              protected location: Location,
              public dialog: MatDialog,
              private translateService: TranslateService,
              protected langService: LanguageService,
              protected wsCommentService: WsCommentServiceService,
              protected commentService: CommentService,
              private liveAnnouncer: LiveAnnouncer) {
    super(roomService, route, location, wsCommentService, commentService);
    langService.langEmitter.subscribe(lang => translateService.use(lang));
  }

  ngOnInit() {
    window.scroll(0, 0);
    this.translateService.use(localStorage.getItem('currentLang'));
    this.route.params.subscribe(params => {
      this.initializeRoom(params['roomId']);
    });
    this.announce();
  }
  public announce() {
    this.liveAnnouncer.announce('Sie befinden sich nun in der Session mit ID.', 'assertive');
  }



  afterRoomLoadHook() {
    if (this.moderationEnabled) {
      this.viewModuleCount = this.viewModuleCount + 1;
      this.commentService.countByRoomId(this.room.id, false).subscribe(commentCounter => {
        this.moderatorCommentCounter = commentCounter;
      });
    }

  }

  updateGeneralSettings() {
    this.room.name = this.updRoom.name;
    this.room.description = this.updRoom.description;
    this.saveChanges();
  }

  updateCommentSettings(settings: CommentSettingsDialog) {
    const commentExtension: TSMap<string, any> = new TSMap();
    this.room.extensions = new TSMap();
    commentExtension.set('enableThreshold', settings.enableThreshold);
    commentExtension.set('commentThreshold', settings.threshold);
    commentExtension.set('enableModeration', settings.enableModeration);
    this.room.extensions.set('comments', commentExtension);

    if (this.moderationEnabled && !settings.enableModeration) {
      this.viewModuleCount = this.viewModuleCount - 1;
    } else if (!this.moderationEnabled && settings.enableModeration) {
      this.viewModuleCount = this.viewModuleCount + 1;
    }

    this.moderationEnabled = settings.enableModeration;
    localStorage.setItem('moderationEnabled', String(this.moderationEnabled));
  }

  resetThreshold(): void {
    if (this.room.extensions && this.room.extensions['comments']) {
      delete this.room.extensions['comments'];
    }
  }

  saveChanges() {
    this.roomService.updateRoom(this.room)
      .subscribe((room) => {
        this.room = room;
        this.translateService.get('room-page.changes-successful').subscribe(msg => {
          this.notification.show(msg);
        });
      });
  }

  showSettingsDialog(): void {
    this.updRoom = JSON.parse(JSON.stringify(this.room));
    const dialogRef = this.dialog.open(RoomEditComponent, {
      width: '400px'
    });
    dialogRef.componentInstance.editRoom = this.updRoom;
    dialogRef.afterClosed()
      .subscribe(result => {
        if (result === 'abort') {
          return;
        } else if (result !== 'delete') {
          this.updateGeneralSettings();
        }
      });
    dialogRef.backdropClick().subscribe( res => {
        dialogRef.close('abort');
    });
  }

  showCommentsDialog(): void {
    this.updRoom = JSON.parse(JSON.stringify(this.room));

    const dialogRef = this.dialog.open(CommentSettingsComponent, {
      width: '400px'
    });
    dialogRef.componentInstance.roomId = this.room.id;
    dialogRef.componentInstance.editRoom = this.updRoom;
    dialogRef.afterClosed()
      .subscribe(result => {
        if (result === 'abort') {
          return;
        } else {
          if (result instanceof CommentSettingsDialog) {
            this.updateCommentSettings(result);
            this.saveChanges();
          }
        }
      });
    dialogRef.backdropClick().subscribe( res => {
      dialogRef.close('abort');
    });
  }

  showModeratorsDialog(): void {
    const dialogRef = this.dialog.open(ModeratorsComponent, {
      width: '400px'
    });
    dialogRef.componentInstance.roomId = this.room.id;
  }

  copyShortId(): void {
    const selBox = document.createElement('textarea');
    selBox.style.position = 'fixed';
    selBox.style.left = '0';
    selBox.style.top = '0';
    selBox.style.opacity = '0';
    selBox.value = `${this.urlToCopy}${this.room.shortId}`;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand('copy');
    document.body.removeChild(selBox);
    this.translateService.get('room-page.session-id-copied').subscribe(msg => {
      this.notification.show(msg, '', { duration: 2000 });
    });
  }
}

