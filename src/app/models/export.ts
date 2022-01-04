import { Room } from './room';
import { CommentService } from '../services/http/comment.service';
import { BonusTokenService } from '../services/http/bonus-token.service';
import { CommentBonusTokenMixin } from './comment-bonus-token-mixin';
import { BonusToken } from './bonus-token';
import { TranslateService } from '@ngx-translate/core';
import { User } from './user';
import { NotificationService } from '../services/util/notification.service';
import { forkJoin, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Comment } from './comment';
import { UserRole } from './user-roles.enum';
import { SpacyKeyword } from '../services/http/spacy.service';
import { CorrectWrong } from './correct-wrong.enum';

interface RoomExportVariables {
  empty: string;
  roomName: string;
  roomCode: string;
  exportDate: string;
  welcomeText: string;
  questionCategories: string;
}

const parseStringEntry = (str: string): string => '"' + str.replace(/[\r\n]/g, ' ')
  .replace(/ +/g, ' ')
  .replace(/"/g, '""') + '"';

const parseStringArray = (strings: string[]): string => parseStringEntry(strings
  .map(str => str.replace(/\\/g, '\\\\').replace(/,/g, '\\,')).join(', '));

const parseBody = (body: string): string => {
  if (!body) {
    return '';
  }
  const verify = (str: string) => str.replace(/{/g, '{{').replace(/}/g, '}}');
  body = JSON.parse(body).reduce((acc, e) => {
    if (typeof e['insert'] === 'string') {
      if (e.attributes) {
        const str = JSON.stringify(e.attributes).replace(/\\/g, '\\\\').replace(/;/g, '\\;');
        return acc + '{attr=' + str + ';' + verify(e['insert']) + '}';
      }
      return acc + verify(e['insert']);
    } else if (typeof e === 'string') {
      return acc + verify(e);
    } else if (e.image) {
      return acc + '{type=image;' + verify(e.image) + '}';
    } else if (e.video) {
      return acc + '{type=video;' + verify(e.video) + '}';
    } else if (e.formula) {
      return acc + '{type=formula;' + verify(e.formula) + '}';
    } else if (e.emoji) {
      return acc + '{type=emoji;' + verify(e.emoji) + '}';
    }
    return acc;
  }, '');
  body = body.replace(/\r\n|\n/g, '{type=newline;}');
  return parseStringEntry(body);
};

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

  public parse(delimiter: string,
               keyTranslations: Map<string, string>,
               roomTranslations: RoomExportVariables,
               room: Room,
               exportDate: string): string {
    if (this.list.length <= 0) {
      return 'd';
    }
    let parse = '';
    const newLine = '\r\n';
    // room
    parse += roomTranslations.roomName + delimiter + parseStringEntry(room.name) + delimiter;
    parse += newLine + roomTranslations.roomCode + delimiter + parseStringEntry(room.shortId) + delimiter;
    parse += newLine + roomTranslations.exportDate + delimiter + exportDate + delimiter;
    parse += newLine + roomTranslations.welcomeText + delimiter +
      (room.description ? parseBody(room.description) : roomTranslations.empty) + delimiter;
    parse += newLine + roomTranslations.questionCategories + delimiter + (room.tags && room.tags.length ?
      parseStringArray(room.tags) : roomTranslations.empty) + delimiter;
    parse += newLine + delimiter + newLine;
    // comments
    if (!keyTranslations) {
      keyTranslations = new Map<string, string>();
      this.keys().forEach(e => keyTranslations.set(e, e));
    }
    parse += this.keys().map(e => keyTranslations.get(e)).join(delimiter) + delimiter;
    this.list.forEach(e => {
      parse += newLine + this.keys().map(k => e.get(k)).join(delimiter) + delimiter;
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
    private moderatorIds: Set<string>,
    private user: User
  ) {
    this.mapper = new ExportMapper<CommentBonusTokenMixin>();
    this.bonusTokenMask = this.user && this.user.role > UserRole.PARTICIPANT;
  }

  public exportAsCsv() {
    let correct = this.translationPath + '.comment-correct';
    let wrong = this.translationPath + '.comment-wrong';
    let acked = this.translationPath + '.comment-acked';
    let refused = this.translationPath + '.comment-refused';
    let bookmarked = this.translationPath + '.comment-bookmarked';
    let notBookmarked = this.translationPath + '.comment-not_bookmarked';
    const roles: [string, string, string] = [
      this.translationPath + '.comment-user-role-participant',
      this.translationPath + '.comment-user-role-moderator',
      this.translationPath + '.comment-user-role-creator'
    ];
    const roomTranslations: RoomExportVariables = {
      empty: this.translationPath + '.export-empty',
      exportDate: this.translationPath + '.room-export-date',
      roomCode: this.translationPath + '.room-code',
      roomName: this.translationPath + '.room-name',
      questionCategories: this.translationPath + '.room-categories',
      welcomeText: this.translationPath + '.room-welcome'
    };
    const roomKeys = Object.keys(roomTranslations);
    const roomValues = roomKeys.map(key => roomTranslations[key]);
    this.translateService.get([
      correct, wrong, acked, refused, bookmarked, notBookmarked, roles[0], roles[1], roles[2], ...roomValues
    ]).subscribe(obj => {
      correct = obj[correct];
      wrong = obj[wrong];
      acked = obj[acked];
      refused = obj[refused];
      bookmarked = obj[bookmarked];
      notBookmarked = obj[notBookmarked];
      roles[0] = obj[roles[0]];
      roles[1] = obj[roles[1]];
      roles[2] = obj[roles[2]];
      for (let i = 0; i < roomKeys.length; i++) {
        roomTranslations[roomKeys[i]] = obj[roomValues[i]];
      }
    });
    this.mapper.add(m => {
      m('question-number', e => e.number);
      m('timestamp', e => this.parseDate(e.timestamp));
      m('question', e => parseBody(e.body));
      m('chosen-category', e => e.tag || '');
      m('chosen-keywords', e => this.parseKeywords(e.keywordsFromQuestioner) || roomTranslations.empty);
      m('answer', e => parseBody(e.answer));
      m('author-role', e => this.getUserString(e.creatorId, roles));
      m('user-name', e => e.questionerName);
      m('user-number', e => '');
      m('upvotes', e => e.upvotes);
      m('downvotes', e => e.downvotes);
      m('score', e => e.score);
      m('public/moderated', e => e.ack ? acked : refused);
      m('correct/wrong', e => this.parseCorrectOrWrong(e.correct, correct, wrong));
      m('bookmark', e => e.bookmark ? bookmarked : notBookmarked);
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
          const data = this.mapper.parse(';', translationMap, roomTranslations, this.room, dateString);
          const fileName = this.room.name + '-' + this.room.shortId + '-' + dateString + '.csv';
          this.exportData(data, fileName);
        }
      });
    });
  }

  private parseCorrectOrWrong(value: CorrectWrong, correct: string, wrong: string): string {
    if (value === CorrectWrong.NULL) {
      return '';
    }
    if (value === CorrectWrong.CORRECT) {
      return correct;
    }
    return wrong;
  }

  private checkUser(e: CommentBonusTokenMixin): boolean {
    return this.bonusTokenMask || e.creatorId === this.user.id;
  }

  private getUserString(id: string, roles: [participant: string, moderator: string, creator: string]): string {
    if (id === this.room.ownerId) {
      return roles[2];
    }
    if (this.moderatorIds.has(id)) {
      return roles[1];
    }
    return roles[0];
  }

  private parseKeywords(keywords: SpacyKeyword[]): string {
    if (!keywords || keywords.length < 1) {
      return null;
    }
    return parseStringArray(keywords.map(keyword => keyword.text));
  }

  private parseDate(date: Date): string {
    if (!date) {
      return '';
    }
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
    let source: Observable<Comment[]> = this.commentService.getAckComments(this.room.id);
    if (this.bonusTokenMask) {
      source = forkJoin([source, this.commentService.getRejectedComments(this.room.id)]).pipe(
        map(res => res[0].concat(res[1]).sort((a, b) => a.number - b.number))
      );
    }
    source.subscribe(data => {
      this.bonusTokenService.getTokensByRoomId(this.room.id).subscribe(list => {
        const c = data.map(comment => {
          const bt: BonusToken = list.find(e => e.accountId === comment.creatorId && comment.id === e.commentId);
          const commentWithToken: CommentBonusTokenMixin = comment as CommentBonusTokenMixin;
          if (bt) {
            commentWithToken.bonusToken = bt.token;
            commentWithToken.bonusTimeStamp = bt.timestamp;
          }
          return commentWithToken;
        });
        comments(c);
      });
    });

  }

  private createTranslationMap(ar: string[], translateMapping: ((m: Map<string, string>) => void)): void {
    const fields = this.addTranslationPath(ar);
    const tm: Map<string, string> = new Map<string, string>();
    this.translateService.get(fields).subscribe(msgs => {
      Object.entries(msgs).forEach((e, i) => {
        tm.set(ar[i], e[1] as string);
      });
      translateMapping(tm);
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
