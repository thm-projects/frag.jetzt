import { CommentService } from '../services/http/comment.service';
import { BonusTokenService } from '../services/http/bonus-token.service';
import { TranslateService } from '@ngx-translate/core';
import { CommentBonusTokenMixin } from './comment-bonus-token-mixin';
import { NotificationService } from '../services/util/notification.service';
import { Room } from './room';
import { User } from './user';


export class ExportCsv {

  constructor(
    private roomId: string,
    private commentService: CommentService,
    private bonusTokenService: BonusTokenService,
    private translationService: TranslateService,
    private notificationService: NotificationService,
    private editRoom: Room,
    private translationPath?: string
  ) {
    if (!translationPath) {
      this.translationPath = 'room-page';
    }
  }

  public exportAsCsv(delimiter: string, format: string, user?: User): void {
    const bonusTokenMask = !user || user.role >= 2;
    this.commentService.getAckComments(this.roomId)
    .subscribe(data => {
      if (data.length > 0) {
        let comments: CommentBonusTokenMixin[];
        this.bonusTokenService.getTokensByRoomId(this.roomId).subscribe( list => {
          comments = data.map(comment => {
            const commentWithToken: CommentBonusTokenMixin = <CommentBonusTokenMixin>comment;
            for (const bt of list) {
              if (commentWithToken.creatorId === bt.userId && comment.id === bt.commentId) {
                if (bonusTokenMask || commentWithToken.creatorId === user.id) {
                  commentWithToken.bonusToken = bt.token;
                  commentWithToken.bonusTimeStamp = bt.timestamp;
                }
              }
            }
            return commentWithToken;
          });
          let sortedComments = comments.sort((a) => {
            return a.bonusToken ? -1 : 1;
          });
          if (!sortedComments[0].bonusToken) {
            sortedComments = comments.sort((a, b) => {
              const dateA = new Date(a.timestamp), dateB = new Date(b.timestamp);
              return (+dateB > +dateA) ? 1 : (+dateA > +dateB) ? -1 : 0;
            });
          } else {
            sortedComments = sortedComments.sort((a, b) => {
              return a.bonusToken < b.bonusToken ? -1 : 1;
            });
          }
          const exportComments = JSON.parse(JSON.stringify(sortedComments));
          let valueFields = '';
          const fieldNames = [
            this.translationPath + '.question',
            this.translationPath + '.timestamp',
            this.translationPath + '.presented',
            this.translationPath + '.correct/wrong',
            this.translationPath + '.score',
            this.translationPath + '.answer',
            this.translationPath + '.token',
            this.translationPath + '.token-time'
          ];
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
              const answer = Object.values(element).slice(11, 12) || '';
              valueFields += answer + delimiter;
              if (Object.values(element).length > 13) {
                valueFields += Object.values(element).slice(13, 14) + delimiter;
                let btTime;
                btTime = Object.values(element).slice(14, 15);
                valueFields += btTime[0].slice(0, 10) + '-' + btTime[0].slice(11, 16) + delimiter + '\r\n';
              } else {
                valueFields += '' + delimiter;
                valueFields += '' + delimiter + '\r\n';
              }
            });
            const date = new Date();
            const dateString = date.toLocaleDateString();
            let file: string;
            file = keyFields + valueFields;
            const myBlob = new Blob([file], { type: `text/${format}` });
            const link = document.createElement('a');
            const fileName = this.editRoom.name + '_' + this.editRoom.shortId + '_' + dateString + '.' + format;
            link.setAttribute('download', fileName);
            link.href = window.URL.createObjectURL(myBlob);
            link.click();
          });
        });
      } else {
        this.translationService.get(this.translationPath + '.no-comments').subscribe(msg => {
          this.notificationService.show(msg);
        });
      }
    });
  }

}
