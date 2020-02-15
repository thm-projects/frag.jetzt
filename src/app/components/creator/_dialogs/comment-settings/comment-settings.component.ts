import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material';
import { RoomCreatorPageComponent } from '../../room-creator-page/room-creator-page.component';
import { NotificationService } from '../../../../services/util/notification.service';
import { TranslateService } from '@ngx-translate/core';
import { RoomService } from '../../../../services/http/room.service';
import { Router } from '@angular/router';
import { CommentService } from '../../../../services/http/comment.service';
import { BonusTokenService } from '../../../../services/http/bonus-token.service';
import { CommentSettingsService } from '../../../../services/http/comment-settings.service';
import { DeleteCommentsComponent } from '../delete-comments/delete-comments.component';
import { ExportFormatComponent } from '../export-format/export-format.component';
import { Room } from '../../../../models/room';
import { CommentBonusTokenMixin } from '../../../../models/comment-bonus-token-mixin';
import { CommentSettings } from '../../../../models/comment-settings';
import { CommentSettingsDialog } from '../../../../models/comment-settings-dialog';
import { del } from 'selenium-webdriver/http';

@Component({
  selector: 'app-comment-settings',
  templateUrl: './comment-settings.component.html',
  styleUrls: ['./comment-settings.component.scss']
})
export class CommentSettingsComponent implements OnInit {

  roomId: string;
  comments: CommentBonusTokenMixin[];
  commentThreshold = -100;
  editRoom: Room;
  settingThreshold = false;
  enableCommentModeration = false;
  directSend = true;
  tagsEnabled = false;
  tags: string[] = [];

  constructor(
    public dialogRef: MatDialogRef<RoomCreatorPageComponent>,
    public dialog: MatDialog,
    public notificationService: NotificationService,
    public translationService: TranslateService,
    protected roomService: RoomService,
    public router: Router,
    public commentService: CommentService,
    public commentSettingsService: CommentSettingsService,
    private bonusTokenService: BonusTokenService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
  }

  ngOnInit() {
    if (this.editRoom.extensions && this.editRoom.extensions['comments']) {
      const commentExtension = this.editRoom.extensions['comments'];
      if (commentExtension.enableThreshold !== null) {
        if (commentExtension.commentThreshold) {
          this.commentThreshold = commentExtension.commentThreshold;
        } else {
          this.commentThreshold = -100;
        }
        this.settingThreshold = commentExtension.enableThreshold;
      }

      if (commentExtension.enableTags !== null) {
        this.tagsEnabled = commentExtension.enableTags;
        this.tags = commentExtension.tags;
      }

      if (this.editRoom.extensions['comments'].enableModeration !== null) {
        this.enableCommentModeration = this.editRoom.extensions['comments'].enableModeration;
      }
    }
    this.commentSettingsService.get(this.roomId).subscribe(settings => {
      this.directSend = settings.directSend;
    });
  }

  onSliderChange(event: any) {
    if (event.value) {
      this.commentThreshold = event.value;
    } else {
      this.commentThreshold = 0;
    }
  }


  openDeleteCommentDialog(): void {
    const dialogRef = this.dialog.open(DeleteCommentsComponent, {
      width: '400px'
    });
    dialogRef.componentInstance.roomId = this.roomId;
    dialogRef.afterClosed()
      .subscribe(result => {
        if (result === 'delete') {
          this.deleteComments();
        }
      });
  }

  deleteComments(): void {
    this.translationService.get('room-page.comments-deleted').subscribe(msg => {
      this.notificationService.show(msg);
    });
    this.commentService.deleteCommentsByRoomId(this.roomId).subscribe();
  }

  export(delimiter: string, date: string): void {
    this.commentService.getAckComments(this.roomId)
      .subscribe(comments => {
        this.bonusTokenService.getTokensByRoomId(this.roomId).subscribe( list => {
          this.comments = comments.map(comment => {
            const commentWithToken: CommentBonusTokenMixin = <CommentBonusTokenMixin>comment;
            for (const bt of list) {
              if (commentWithToken.creatorId === bt.userId && comment.id === bt.commentId) {
                commentWithToken.bonusToken = bt.token;
                commentWithToken.bonusTimeStamp = bt.timestamp;
              }
            }
            return commentWithToken;
          });
          const exportComments = JSON.parse(JSON.stringify(this.comments));
          let valueFields = '';
          const fieldNames = ['room-page.question', 'room-page.timestamp', 'room-page.presented', 'room-page.correct/wrong',
            'room-page.score', 'room-page.token', 'room-page.token-time'];
          let keyFields = '';
          this.translationService.get(fieldNames).subscribe(msgs => {
            for (let i = 0; i < fieldNames.length; i++) {
              keyFields += (msgs[fieldNames[i]] + delimiter);
            }
            keyFields += '\r\n';
            exportComments.forEach(element => {
              element.body = '"' + element.body.replace(/[\r\n]/g, ' ').replace(/ +/g, ' ').replace(/"/g, '""') + '"';
              valueFields += Object.values(element).slice(3, 4) + delimiter;
              let time;
              time = Object.values(element).slice(4, 5);
              valueFields += time[0].slice(0, 10) + '-' + time[0].slice(11, 16) + delimiter;
              valueFields += Object.values(element).slice(5, 6) + delimiter;
              valueFields += Object.values(element).slice(7, 8) + delimiter;
              valueFields += Object.values(element).slice(9, 10) + delimiter;
              if (Object.values(element).length > 12) {
                valueFields += Object.values(element).slice(12, 13) + delimiter;
                let btTime;
                btTime = Object.values(element).slice(13, 14);
                valueFields += btTime[0].slice(0, 10) + '-' + btTime[0].slice(11, 16) + delimiter + '\r\n';
              } else {
                valueFields += '' + delimiter;
                valueFields += '' + delimiter + '\r\n';
              }
            });
            const format = delimiter === ';' ? 'xls' : 'csv';
            let file: string;
            file = keyFields + valueFields;
            const myBlob = new Blob([file], { type: `text/${format}` });
            const link = document.createElement('a');
            const fileName = this.editRoom.name + '_' + this.editRoom.shortId + '_' + date + '.' + format;
            link.setAttribute('download', fileName);
            link.href = window.URL.createObjectURL(myBlob);
            link.click();
          });
        });
      });
  }

  onExport(exportType: string): void {
    const date = new Date();
    const dateString = date.toLocaleDateString();
    if (exportType === 'comma') {
      this.export(',', dateString);
    } else if (exportType === 'semicolon') {
      this.export(';', dateString);
    }
  }

  openExportDialog(): void {
    const dialogRef = this.dialog.open(ExportFormatComponent, {
      width: '400px'
    });
    dialogRef.afterClosed().subscribe(result => {
      this.onExport(result);
    });
  }

  closeDialog(): void {
    const commentSettings = new CommentSettings();
    commentSettings.roomId = this.roomId;
    commentSettings.directSend = this.directSend;
    this.commentSettingsService.update(commentSettings).subscribe( x => {
      const settingsReturn = new CommentSettingsDialog();
      settingsReturn.enableModeration = this.enableCommentModeration;
      settingsReturn.directSend = this.directSend;
      settingsReturn.enableThreshold = this.settingThreshold;
      settingsReturn.threshold = this.commentThreshold;
      this.dialogRef.close(settingsReturn);
    });
  }


  /**
   * Returns a lambda which closes the dialog on call.
   */
  buildCloseDialogActionCallback(): () => void {
    return () => this.dialogRef.close('abort');
  }


  /**
   * Returns a lambda which executes the dialog dedicated action on call.
   */
  buildSaveActionCallback(): () => void {
    return () => this.closeDialog();
  }
}
