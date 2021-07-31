import { Room } from './room';
import { CommentService } from '../services/http/comment.service';
import { BonusTokenService } from '../services/http/bonus-token.service';
import { CommentBonusTokenMixin } from './comment-bonus-token-mixin';
import { BonusToken } from './bonus-token';
import { TranslateService } from '@ngx-translate/core';
import { User } from './user';
import { NotificationService } from '../services/util/notification.service';

class ExportMapper<E> {

  private list: Map<string, string>[];
  private map: Map<string, (e: E) => any>;

  constructor() {
    this.list = [];
    this.map = new Map<string, (e: E) => any>();
  }

  public add(m: (f: (key: string, value: (e: E) => any) => void) => void): void {
    m((key, value) => this.map.set(key, value));
  }

  public acceptAll(ar: E[]): void {
    ar.forEach(elem => {
      this.accept(elem);
    });
  }

  public accept(e: E): void {
    const row: Map<string, string> = new Map<string, string>();
    this.keys().forEach(k => {
      row.set(k, this.map.get(k)(e));
    });
    this.list.push(row);
  }

  public parse(delimiter: string, map?: Map<string, string>): string {
    if (this.list.length <= 0) { return 'd'; }
    let parse = '';
    if (!map) {
      map = new Map<string, string>();
      this.keys().forEach(e => map.set(e, e));
    }
    this.keys().forEach(e => parse += map.get(e) + delimiter);
    this.list.forEach(e => {
      parse += '\r\n';
      this.keys().forEach(k => {
        parse += e.get(k) + delimiter;
      });
    });
    return parse;
  }

  public keys(): string[] {
    return Array.from(this.map.keys());
  }

}

export class Export {

  private mapper: ExportMapper<CommentBonusTokenMixin>;
  private bonusTokenMask: boolean;

  constructor(
    private room: Room,
    private commentService: CommentService,
    private bonusTokenService: BonusTokenService,
    private translateService: TranslateService,
    private translationPath: string,
    private notificationService: NotificationService,
    private user?: User
  ) {
    this.mapper = new ExportMapper<CommentBonusTokenMixin>();
    this.bonusTokenMask = !this.user || this.user.role >= 2;
  }

  public exportAsCsv() {
    this.mapper.add(m => {
      m('question', e => this.parseBody(e.body));
      m('timestamp', e => this.parseDate(e.timestamp));
      m('presented', e => e.read);
      m('correct/wrong', e => e.correct);
      m('score', e => e.score);
      m('answer', e => this.parseBody(e.answer));
      m('token', e => this.checkUser(e) && e.bonusToken ? e.bonusToken : '');
      m('token-time', e => this.checkUser(e) ? this.parseDate(e.bonusTimeStamp) : '');
    });
    this.createTranslationMap(this.mapper.keys(), translationMap => {
      this.getCommentBonusTokenMixin(comments => {
        if (comments.length <= 0) {
          this.translateService.get(this.translationPath + '.no-comments').subscribe(msg => {
            this.notificationService.show(msg);
          });
        } else {
          this.mapper.acceptAll(comments);
          const date = new Date();
          const dateString = date.toLocaleDateString();
          const data = this.mapper.parse(';', translationMap);
          const fileName = this.room.name + '-' + this.room.shortId + '-' + dateString + '.csv';
          this.exportData(data, fileName);
        }
      });
    });
  }

  private checkUser(e: CommentBonusTokenMixin): boolean {
    return this.bonusTokenMask || e.creatorId === this.user.id;
  }

  private parseBody(body: string): string {
    if (!body) {return ''; }
    return '"' + body.replace(/[\r\n]/g, ' ').replace(/ +/g, ' ').replace(/"/g, '""') + '"';
  }

  private parseDate(date: Date): string {
    if (!date) {return ''; }
    const d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
  }

  private exportData(data: string, fileName: string) {
    const myBlob = new Blob([data], { type: `text/csv` });
    const link = document.createElement('a');
    link.setAttribute('download', fileName);
    link.href = window.URL.createObjectURL(myBlob);
    link.click();
  }

  private getCommentBonusTokenMixin(comments: (comments: CommentBonusTokenMixin[]) => void) {
    this.commentService.getAckComments(this.room.id).subscribe(data => {
      this.bonusTokenService.getTokensByRoomId(this.room.id).subscribe(list => {
        const c = data.map(comment => {
          const bt: BonusToken = list.find(e => e.accountId === comment.creatorId && comment.id === e.commentId);
          const commentWithToken: CommentBonusTokenMixin = <CommentBonusTokenMixin>comment;
          if (bt) {
            commentWithToken.bonusToken = bt.token;
            commentWithToken.bonusTimeStamp = bt.timestamp;
          }
          return commentWithToken;
        }).sort(e => e.bonusToken ? -1 : 1);
        comments(c);
      });
    });

  }

  private createTranslationMap(ar: string[], map: ((m: Map<string, string>) => void)): void {
    const fields = this.addTranslationPath(ar);
    const tm: Map<string, string> = new Map<string, string>();
    this.translateService.get(fields).subscribe(msgs => {
      Object.entries(msgs).forEach((e, i) => {
        tm.set(ar[i], <string>e[1]);
      });
      map(tm);
    });
  }

  private addTranslationPath(ar: string[]): string[] {
    const fields = [];
    ar.forEach(e => {
      fields.push(this.translationPath + '.' + e);
    });
    return fields;
  }

}
