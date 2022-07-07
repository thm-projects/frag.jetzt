import { Room } from '../models/room';
import { forkJoin, Observable, of } from 'rxjs';
import { ExportTable, ImportExportManager } from './ImportExportManager';
import { TranslateService } from '@ngx-translate/core';
import { Comment, numberSorter } from '../models/comment';
import { CorrectWrong } from '../models/correct-wrong.enum';
import { User } from '../models/user';
import { UserRole } from '../models/user-roles.enum';
import { CommentBonusTokenMixin } from '../models/comment-bonus-token-mixin';
import { NotificationService } from '../services/util/notification.service';
import { BonusTokenService } from '../services/http/bonus-token.service';
import { map, mergeMap, switchMap } from 'rxjs/operators';
import { CommentService } from '../services/http/comment.service';
import { RoomService } from '../services/http/room.service';
import { TSMap } from 'typescript-map';
import { SpacyKeyword } from '../services/http/spacy.service';
import { ModeratorService } from '../services/http/moderator.service';
import { ImmutableStandardDelta, QuillUtils, SerializedDelta } from './quill-utils';

const serializeDate = (str: string | number | Date) => {
  if (!str) {
    return '';
  }
  return new Date(str).toLocaleString();
};

const serializeStringArray = (arr: string[]) =>
  arr.map(str => str.replace(/\\/g, '\\\\').replace(/,/g, '\\,')).join(',');

const deserializeStringArray = (str: string) => {
  const regex = /([^\\]|^),/g;
  let m;
  let lastIndex = 0;
  const result = [];
  while ((m = regex.exec(str)) !== null) {
    result.push(str.substring(lastIndex, m.index + 1).replace(/\\,/g, ',').replace(/\\\\/g, '\\'));
    lastIndex = m.index + m[0].length;
  }
  result.push(str.substring(lastIndex).replace(/\\,/g, ',').replace(/\\\\/g, '\\'));
  return result;
};

export const copyCSVString = (value: string, fileName: string) => {
  const myBlob = new Blob([value], { type: `text/csv` });
  const link = document.createElement('a');
  link.setAttribute('download', fileName);
  link.href = window.URL.createObjectURL(myBlob);
  link.click();
};

export const uploadCSV = (): Observable<string> => new Observable<string>(subscriber => {
  const input = document.createElement('input');
  input.type = 'file';
  input.style.display = 'none';
  input.click();
  let hadData = false;
  input.addEventListener('change', _ => {
    hadData = true;
    const reader = new FileReader();
    reader.addEventListener('load', (event) => {
      subscriber.next(event.target.result as string);
      subscriber.complete();
    });
    reader.readAsText(input.files[0]);
  }, { once: true });
  window.addEventListener('focus', _ => {
    input.remove();
    setTimeout(() => {
      if (!hadData) {
        subscriber.next(null);
        subscriber.complete();
      }
    });
  }, { once: true });
});

export interface BonusArchiveEntry {
  bonusToken: string;
  bonusTimestamp: Date;
  question: SerializedDelta;
  bonusQuestionNumber: string;
  userLoginId: string;
}

const bonusArchiveImportExport = (translateService: TranslateService) =>
  new ImportExportManager(translateService, [
    { type: 'value', languageKey: 'bonus-archive-export.date' },
    { type: 'value', languageKey: 'bonus-archive-export.name' },
    { type: 'value', languageKey: 'bonus-archive-export.code' },
    null,
    {
      type: 'table', columns: [
        {
          languageKey: 'bonus-archive-export.entry-commentNumber',
          valueMapper: {
            export: (config, k) => k.bonusQuestionNumber,
            import: (config, val) => ({ bonusQuestionNumber: val } as BonusArchiveEntry)
          }
        },
        {
          languageKey: 'bonus-archive-export.entry-token',
          valueMapper: {
            export: (config, k) => k.bonusToken,
            import: (config, val, prev) => {
              prev.bonusToken = val || null;
              return prev;
            }
          }
        },
        {
          languageKey: 'bonus-archive-export.entry-question',
          ...ImportExportManager.createQuillMapper<BonusArchiveEntry>('bonus-archive-export.empty',
            (c) => c.question, (val, c) => {
              c.question = val as SerializedDelta;
              return c;
            })
        },
        {
          languageKey: 'bonus-archive-export.entry-date',
          valueMapper: {
            export: (config, k) => serializeDate(k.bonusTimestamp),
            import: (config, val, prev) => {
              prev.bonusTimestamp = val ? new Date(val) : null;
              return prev;
            }
          }
        },
        {
          languageKey: 'bonus-archive-export.user-name',
          additionalLanguageKeys: ['bonus-archive-export.user-anonym'],
          valueMapper: {
            export: (config, k) => k.userLoginId ? k.userLoginId : config.additional[0],
            import: (config, val, prev) => {
              prev.userLoginId = val && val !== config.additional[0] ? val : null;
              return prev;
            }
          }
        }
      ]
    } as ExportTable<BonusArchiveEntry>
  ]);

export const exportBonusArchive = (
  translateService: TranslateService,
  commentService: CommentService,
  notificationService: NotificationService,
  bonusTokenService: BonusTokenService,
  moderatorService: ModeratorService,
  room: Room
): Observable<[string, string]> =>
  bonusTokenService.getTokensByRoomId(room.id).pipe(
    switchMap(tokens => {
      if (tokens.length < 1) {
        translateService.get('bonus-archive-export.no-data')
          .subscribe(text => notificationService.show(text));
        return null;
      }
      return forkJoin(tokens.map(token => commentService.getComment(token.commentId))).pipe(
        switchMap(comments => {
          const filteredComments = new Set(comments.filter(v => v?.creatorId).map(comment => comment.creatorId));
          return moderatorService.getUserData([...filteredComments]).pipe(
            map(users => {
              const fastAccess = {} as any;
              users.forEach(user => {
                if (user) {
                  fastAccess[user.id] = user['email'];
                }
              });
              return comments.map(c => [fastAccess[c?.creatorId], c]);
            })
          );
        }),
        switchMap((arr: [userId: string, c: Comment][]) => {
          arr.sort(([_, a], [__, b]) => numberSorter(a?.number, b?.number));
          const data: BonusArchiveEntry[] = arr.map(([loginId, c], i) => ({
            question: QuillUtils.serializeDelta(c?.body),
            bonusToken: tokens[i].token,
            bonusTimestamp: tokens[i].createdAt,
            bonusQuestionNumber: c?.number,
            userLoginId: loginId
          }));
          const date = new Date();
          return bonusArchiveImportExport(translateService).exportToCSV([
            date.toLocaleString(),
            room.name,
            room.shortId,
            data
          ]).pipe(
            map(text => [text, date.toLocaleDateString()] as [string, string])
          );
        })
      );
    })
  );

const roomImportExport = (
  translateService: TranslateService,
  translatePath: string,
  user?: User,
  room?: Room,
  moderatorIds?: Set<string>
) => {
  const empty = translatePath + '.export-empty';
  const bufferedIds = [];
  const isMod = (user?.role || UserRole.PARTICIPANT) > UserRole.PARTICIPANT;
  return new ImportExportManager(translateService, [
    { type: 'value', languageKey: translatePath + '.room-name' },
    { type: 'value', languageKey: translatePath + '.room-code' },
    { type: 'value', languageKey: translatePath + '.room-export-date' },
    {
      type: 'value',
      languageKey: translatePath + '.room-welcome',
      ...ImportExportManager.createQuillMapper<SerializedDelta>(empty, e => e, e => e as SerializedDelta)
    },
    {
      type: 'value',
      languageKey: translatePath + '.room-categories',
      additionalLanguageKeys: [empty],
      valueMapper: {
        export: (cfg, val) => val?.length ? serializeStringArray(val) : cfg.additional[0],
        import: (cfg, val) => val === cfg.additional[0] ? [] : deserializeStringArray(val)
      }
    },
    null,
    {
      type: 'table',
      columns: [
        {
          languageKey: translatePath + '.question-number',
          valueMapper: {
            export: (cfg, c) => c.number,
            import: (cfg, val) => {
              const c = new Comment();
              c.number = val;
              return c;
            }
          }
        },
        {
          languageKey: translatePath + '.timestamp',
          valueMapper: {
            export: (cfg, c) => serializeDate(c.createdAt as unknown as string),
            import: (cfg, val, prev) => {
              prev.createdAt = (val ? Date.parse(val) : '') as unknown as Date;
              return prev;
            }
          }
        },
        {
          languageKey: translatePath + '.question',
          ...ImportExportManager.createQuillMapper<Comment>(empty, c => QuillUtils.serializeDelta(c.body), (str, c) => {
            c.body = QuillUtils.deserializeDelta(str as SerializedDelta);
            return c;
          })
        },
        {
          languageKey: translatePath + '.chosen-category',
          valueMapper: {
            export: (cfg, val) => val.tag || '',
            import: (cfg, val, c) => {
              c.tag = val ? val : null;
              return c;
            }
          }
        },
        {
          languageKey: translatePath + '.chosen-keywords',
          additionalLanguageKeys: [empty],
          valueMapper: {
            export: (cfg, val) =>
              val.keywordsFromQuestioner?.length ?
                serializeStringArray(val.keywordsFromQuestioner.map(word => word.text)) :
                cfg.additional[0],
            import: (cfg, val, c) => {
              c.keywordsFromQuestioner = val === cfg.additional[0] ? [] : deserializeStringArray(val);
              return c;
            }
          }
        },
        {
          languageKey: translatePath + '.author-role',
          additionalLanguageKeys: [
            translatePath + '.comment-user-role-participant',
            translatePath + '.comment-user-role-moderator',
            translatePath + '.comment-user-role-creator',
          ],
          valueMapper: {
            export: (cfg, val) => {
              if (val.creatorId === room.ownerId) {
                return cfg.additional[2];
              }
              if (moderatorIds.has(val.creatorId)) {
                return cfg.additional[1];
              }
              return cfg.additional[0];
            },
            import: (cfg, val, c) => c
          }
        },
        {
          languageKey: translatePath + '.user-name',
          valueMapper: {
            export: (cfg, c) => c.questionerName,
            import: (cfg, val, c) => {
              c.questionerName = val;
              return c;
            }
          }
        },
        {
          languageKey: translatePath + '.user-number',
          valueMapper: {
            export: (cfg, c) => {
              let index = bufferedIds.indexOf(c.creatorId);
              if (index < 0) {
                index = bufferedIds.push(c.creatorId) - 1;
              }
              return String(index);
            },
            import: (cfg, val, c) => {
              c.creatorId = val;
              return c;
            }
          }
        },
        {
          languageKey: translatePath + '.upvotes',
          valueMapper: {
            export: (cfg, c) => String(c.upvotes),
            import: (cfg, val, c) => {
              c.upvotes = parseInt(val, 10);
              return c;
            }
          }
        },
        {
          languageKey: translatePath + '.downvotes',
          valueMapper: {
            export: (cfg, c) => String(c.downvotes),
            import: (cfg, val, c) => {
              c.downvotes = parseInt(val, 10);
              return c;
            }
          }
        },
        {
          languageKey: translatePath + '.score',
          valueMapper: {
            export: (cfg, c) => String(c.score),
            import: (cfg, val, c) => {
              c.score = parseInt(val, 10);
              return c;
            }
          }
        },
        {
          languageKey: translatePath + '.public/moderated',
          additionalLanguageKeys: [
            translatePath + '.comment-acked',
            translatePath + '.comment-refused',
          ],
          valueMapper: {
            export: (cfg, c) =>
              cfg.additional[c.ack ? 0 : 1],
            import: (cfg, val, c) => {
              c.ack = val === cfg.additional[0];
              return c;
            }
          }
        },
        {
          languageKey: translatePath + '.correct/wrong',
          additionalLanguageKeys: [
            translatePath + '.comment-correct',
            translatePath + '.comment-wrong',
          ],
          valueMapper: {
            export: (cfg, c) => {
              if (c.correct === CorrectWrong.NULL) {
                return '';
              }
              return cfg.additional[c.correct === CorrectWrong.CORRECT ? 0 : 1];
            },
            import: (cfg, val, c) => {
              if (val === cfg.additional[translatePath + '.comment-correct']) {
                c.correct = CorrectWrong.CORRECT;
              } else if (val === cfg.additional[translatePath + '.comment-wrong']) {
                c.correct = CorrectWrong.WRONG;
              } else {
                c.correct = CorrectWrong.NULL;
              }
              return c;
            }
          }
        },
        {
          languageKey: translatePath + '.bookmark',
          additionalLanguageKeys: [
            translatePath + '.comment-bookmarked',
            translatePath + '.comment-not_bookmarked',
          ],
          valueMapper: {
            export: (cfg, c) =>
              cfg.additional[c.bookmark ? 0 : 1],
            import: (cfg, val, c) => {
              c.bookmark = val === cfg.additional[0];
              return c;
            }
          }
        },
        {
          languageKey: translatePath + '.token',
          valueMapper: {
            export: (cfg, c) =>
              c.bonusToken && (isMod || c.creatorId === user?.id) ? c.bonusToken : '',
            import: (cfg, val, c) => {
              c.bonusToken = val;
              return c;
            }
          }
        },
        {
          languageKey: translatePath + '.token-time',
          valueMapper: {
            export: (cfg, c) =>
              c.bonusTimeStamp && (isMod || c.creatorId === user?.id) ?
                serializeDate(c.bonusTimeStamp as unknown as string) : '',
            import: (cfg, val, c) => {
              c.bonusTimeStamp = (val ? Date.parse(val) : '') as unknown as Date;
              return c;
            }
          }
        }
      ]
    } as ExportTable<CommentBonusTokenMixin>,
  ]);
};

export const exportRoom = (translateService: TranslateService,
                           notificationService: NotificationService,
                           bonusTokenService: BonusTokenService,
                           commentService: CommentService,
                           translatePath: string,
                           user: User,
                           room: Room,
                           moderatorIds: Set<string>): Observable<[string, string]> =>
  commentService.getAckComments(room.id).pipe(
    switchMap(res => {
      if ((user?.role || UserRole.PARTICIPANT) > UserRole.PARTICIPANT) {
        return commentService.getRejectedComments(room.id).pipe(
          map(comments => [res, comments])
        );
      }
      return of([res, []]);
    }),
    switchMap(res => {
      const comments = [...res[0], ...res[1]] as CommentBonusTokenMixin[];
      if (comments.length < 1) {
        translateService.get(translatePath + '.no-comments').subscribe(msg => {
          notificationService.show(msg);
        });
        return null;
      }
      comments.sort((a, b) => numberSorter(a.number, b.number));
      return bonusTokenService.getTokensByRoomId(room.id)
        .pipe(switchMap(value => {
          for (const comment of comments) {
            const bonusToken = value.find(v => v.accountId === comment.creatorId && v.commentId === comment.id);
            if (bonusToken) {
              comment.bonusToken = bonusToken.token;
              comment.bonusTimeStamp = bonusToken.createdAt;
            }
          }
          const dateString = new Date().toLocaleDateString();
          return roomImportExport(translateService, translatePath, user, room, moderatorIds).exportToCSV([
            room.name,
            room.shortId,
            dateString,
            QuillUtils.serializeDelta(room.description),
            room.tags,
            comments
          ]).pipe(map(data => [data, dateString] as [string, string]));
        }));
    })
  );

export type ImportQuestionsResult = [
  roomName: string,
  roomShortId: string,
  exportDate: string,
  roomDescription: SerializedDelta,
  roomTags: string[],
  comments: CommentBonusTokenMixin[]
];

const generateCommentCreatorIds = (observer: Observable<ImportQuestionsResult>,
                                   roomService: RoomService,
                                   roomId: string): Observable<ImportQuestionsResult> => observer.pipe(
  mergeMap(value => {
    value[5] = value[5].filter(c => c.creatorId);
    const userSet = new Set<string>(value[5].map(c => c.creatorId));
    const fastAccess = {} as any;
    [...userSet].forEach((user, index) => fastAccess[user] = index);
    return roomService.createGuestsForImport(roomId, userSet.size).pipe(
      map(guestIds => {
        value[5].forEach(c => {
          c.creatorId = guestIds[fastAccess[c.creatorId]];
        });
        return value;
      })
    );
  })
);

const importRoomSettings = (value: ImportQuestionsResult,
                            roomService: RoomService,
                            roomId: string): Observable<ImportQuestionsResult> => roomService.patchRoom(roomId, {
  name: value[0],
  description: value[3],
  tags: value[4],
}).pipe(map(_ => value));

const ALLOWED_FIELDS: (keyof Comment)[] = [
  'favorite', 'bookmark', 'correct', 'ack', 'tag', 'keywordsFromSpacy', 'keywordsFromQuestioner', 'language'
];

const importComment = (comment: CommentBonusTokenMixin,
                       roomId: string,
                       commentService: CommentService): Observable<Comment> => {
  const { bonusToken, bonusTimeStamp, ...realComment } = comment;
  realComment.roomId = roomId;
  if (bonusToken && bonusTimeStamp) {
    realComment.favorite = true;
  }
  return commentService.addComment(realComment).pipe(
    mergeMap(c => {
      realComment.id = c.id;
      const changes = new TSMap<string, any>();
      realComment.keywordsFromSpacy = JSON.stringify(realComment.keywordsFromSpacy || []) as unknown as SpacyKeyword[];
      realComment.keywordsFromQuestioner = JSON.stringify(realComment.keywordsFromQuestioner || []) as unknown as SpacyKeyword[];
      realComment.body = QuillUtils.serializeDelta(realComment.body) as unknown as ImmutableStandardDelta;
      ALLOWED_FIELDS.forEach(key => changes.set(key, realComment[key]));
      return commentService.patchComment(realComment, changes);
    })
  );
};

export const importToRoom = (translateService: TranslateService,
                             roomId: string,
                             roomService: RoomService,
                             commentService: CommentService,
                             translatePath: string,
                             csv: string): Observable<ImportQuestionsResult> => {
  const result = roomImportExport(translateService, translatePath)
    .importFromCSV(csv) as Observable<ImportQuestionsResult>;
  return generateCommentCreatorIds(result, roomService, roomId)
    .pipe(
      mergeMap(value => importRoomSettings(value, roomService, roomId)),
      mergeMap(value => forkJoin(value[5].map(c => importComment(c, roomId, commentService)))),
      mergeMap(_ => result)
    );
};
