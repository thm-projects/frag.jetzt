import { Component, OnInit } from '@angular/core';
import { RoomService } from '../../../services/http/room.service';
import { ActivatedRoute } from '@angular/router';
import { RoomPageComponent } from '../../shared/room-page/room-page.component';
import { Room } from '../../../models/room';
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

  constructor(protected roomService: RoomService,
              protected notification: NotificationService,
              protected route: ActivatedRoute,
              protected location: Location,
              public dialog: MatDialog,
              private translateService: TranslateService,
              protected langService: LanguageService,
              protected wsCommentService: WsCommentServiceService,
              protected commentService: CommentService) {
    super(roomService, route, location, wsCommentService, commentService);
    langService.langEmitter.subscribe(lang => translateService.use(lang));
  }

  ngOnInit() {
    window.scroll(0, 0);
    this.translateService.use(localStorage.getItem('currentLang'));
    this.route.params.subscribe(params => {
      this.initializeRoom(params['roomId']);
    });
  }

  updateGeneralSettings() {
    this.room.name = this.updRoom.name;
    this.room.description = this.updRoom.description;
    this.saveChanges();
  }

  updateCommentSettings(threshold: number) {
    if (threshold > -50) {
      const commentExtension: TSMap<string, any> = new TSMap();
      commentExtension.set('commentThreshold', threshold);
      this.room.extensions = new TSMap();
      this.room.extensions.set('comments', commentExtension);
    }
    this.saveChanges();
  }

  saveChanges() {
    this.roomService.updateRoom(this.room)
      .subscribe(() => {
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
        } else if (result !== 'delete') {
          this.updateCommentSettings(+result);
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
    let selBox = document.createElement('textarea');
    selBox.style.position = 'fixed';
    selBox.style.left = '0';
    selBox.style.top = '0';
    selBox.style.opacity = '0';
    selBox.value = this.room.shortId;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand('copy');
    document.body.removeChild(selBox);
  }
}

