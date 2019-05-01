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

@Component({
  selector: 'app-room-creator-page',
  templateUrl: './room-creator-page.component.html',
  styleUrls: ['./room-creator-page.component.scss']
})
export class RoomCreatorPageComponent extends RoomPageComponent implements OnInit {
  room: Room;
  updRoom: Room;
  themeClass = localStorage.getItem('classNameOfTheme');
  commentThreshold: number;
  updCommentThreshold: number;

  constructor(protected roomService: RoomService,
              protected notification: NotificationService,
              protected route: ActivatedRoute,
              protected location: Location,
              public dialog: MatDialog,
              private translateService: TranslateService,
              protected langService: LanguageService) {
    super(roomService, route, location);
    langService.langEmitter.subscribe(lang => translateService.use(lang));
  }

  ngOnInit() {
    window.scroll(0, 0);
    this.translateService.use(localStorage.getItem('currentLang'));
    this.route.params.subscribe(params => {
      this.getRoom(params['roomId']);
    });
  }

  updateRoom(threshold: number): void {
    this.room.name = this.updRoom.name;
    this.room.description = this.updRoom.description;
    if (threshold > -50) {
      const commentExtension: TSMap<string, any> = new TSMap();
      commentExtension.set('commentThreshold', threshold);
      this.room.extensions = new TSMap();
      this.room.extensions.set('comments', commentExtension);
    }
    this.roomService.updateRoom(this.room)
      .subscribe(() => {
        this.translateService.get('room-page.changes-successful').subscribe(msg => {
          this.notification.show(msg);
        });
      });
  }

  showEditDialog(): void {
    this.updRoom = this.room;
    const dialogRef = this.dialog.open(RoomEditComponent, {
      width: '400px'
    });
    dialogRef.componentInstance.editRoom = this.updRoom;
    dialogRef.componentInstance.commentThreshold = this.updCommentThreshold;
    dialogRef.afterClosed()
      .subscribe(result => {
        if (result === 'abort') {
          return;
        } else {
          this.updateRoom(+result);
        }
      });
    dialogRef.backdropClick().subscribe( res => {
        dialogRef.close('abort');
    });
  }
}

