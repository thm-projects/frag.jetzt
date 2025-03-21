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
import { catchError, map, mergeMap, switchMap } from 'rxjs/operators';
import { CommentService } from '../services/http/comment.service';
import { RoomService } from '../services/http/room.service';
import { ModeratorService } from '../services/http/moderator.service';
import { UUID } from './ts-utils';

const serializeDate = (str: string | number | Date) => {
  if (!str) {
    return '';
  }
  return new Date(str).toLocaleString();
};

const deserializeDate = (inputStr: string): Date => {
  if (!inputStr) {
    return null;
  }
  const str = new Date(1234, 4, 6, 7, 8, 9).toLocaleString();
  const arr = [1234, 4, 6, 7, 8, 9];
  const mapper = {
    1234: 0,
    5: 1,
    6: 2,
    7: 3,
    8: 4,
    9: 5,
  };
  const opts = str.split(/\d+/g);
  let ptr = opts[0].length;
  let sourcePtr = ptr;
  for (let i = 1; i < opts.length - 1; i++) {
    const next = str.indexOf(opts[i], ptr);
    const nextSrc = inputStr.indexOf(opts[i], sourcePtr);
    arr[mapper[+str.substring(ptr, next)]] = +inputStr.substring(
      sourcePtr,
      nextSrc,
    );
    ptr = next + opts[i].length;
    sourcePtr = nextSrc + opts[i].length;
  }
  const len = opts[opts.length - 1].length;
  arr[mapper[+str.substring(ptr, str.length - len)]] = +inputStr.substring(
    sourcePtr,
    inputStr.length - len,
  );
  const d = new Date(arr[0], arr[1] - 1, arr[2], arr[3], arr[4], arr[5]);
  if (isNaN(d.getTime())) {
    return null;
  }
  return d;
};

const serializeStringArray = (arr: string[]) =>
  arr.map((str) => str.replace(/\\/g, '\\\\').replace(/,/g, '\\,')).join(',');

const deserializeStringArray = (str: string) => {
  const regex = /([^\\]|^),/g;
  let m;
  let lastIndex = 0;
  const result = [];
  while ((m = regex.exec(str)) !== null) {
    result.push(
      str
        .substring(lastIndex, m.index + 1)
        .replace(/\\,/g, ',')
        .replace(/\\\\/g, '\\'),
    );
    lastIndex = m.index + m[0].length;
  }
  result.push(
    str.substring(lastIndex).replace(/\\,/g, ',').replace(/\\\\/g, '\\'),
  );
  return result;
};

export const copyCSVString = (value: string, fileName: string) => {
  const myBlob = new Blob([value], { type: `text/csv` });
  const link = document.createElement('a');
  link.setAttribute('download', fileName);
  link.href = window.URL.createObjectURL(myBlob);
  link.click();
};

export const uploadCSV = (): Observable<string> =>
  new Observable<string>((subscriber) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.style.display = 'none';
    input.click();
    let hadData = false;
    input.addEventListener(
      'change',
      () => {
        hadData = true;
        const reader = new FileReader();
        reader.addEventListener('load', (event) => {
          subscriber.next(event.target.result as string);
          subscriber.complete();
        });
        reader.readAsText(input.files[0]);
      },
      { once: true },
    );
    const func = (e: Event) => {
      if (e.target === window) {
        window.addEventListener('focus', func, { once: true });
        return;
      }
      input.remove();
      setTimeout(() => {
        if (!hadData) {
          subscriber.next(null);
          subscriber.complete();
        }
      });
    };
    window.addEventListener('focus', func, { once: true });
  });

export interface BonusArchiveEntry {
  bonusToken: string;
  bonusTimestamp: Date;
  question: string;
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
      type: 'table',
      columns: [
        {
          languageKey: 'bonus-archive-export.entry-commentNumber',
          valueMapper: {
            export: (config, k) => k.bonusQuestionNumber,
            import: (config, val) =>
              ({ bonusQuestionNumber: val }) as BonusArchiveEntry,
          },
        },
        {
          languageKey: 'bonus-archive-export.entry-token',
          valueMapper: {
            export: (config, k) => k.bonusToken,
            import: (config, val, prev) => {
              prev.bonusToken = val || null;
              return prev;
            },
          },
        },
        {
          languageKey: 'bonus-archive-export.entry-question',
          valueMapper: {
            export: (cfg, k) => k.question,
            import: (cfg, val, prev) => {
              prev.question = val;
              return prev;
            },
          },
        },
        {
          languageKey: 'bonus-archive-export.entry-date',
          valueMapper: {
            export: (config, k) => serializeDate(k.bonusTimestamp),
            import: (config, val, prev) => {
              prev.bonusTimestamp = val ? new Date(val) : null;
              return prev;
            },
          },
        },
        {
          languageKey: 'bonus-archive-export.user-name',
          additionalLanguageKeys: ['bonus-archive-export.user-anonym'],
          valueMapper: {
            export: (config, k) =>
              k.userLoginId ? k.userLoginId : config.additional[0],
            import: (config, val, prev) => {
              prev.userLoginId =
                val && val !== config.additional[0] ? val : null;
              return prev;
            },
          },
        },
      ],
    } as ExportTable<BonusArchiveEntry>,
  ]);

export const exportBonusArchive = (
  translateService: TranslateService,
  commentService: CommentService,
  notificationService: NotificationService,
  bonusTokenService: BonusTokenService,
  moderatorService: ModeratorService,
  room: Room,
): Observable<[string, string]> =>
  bonusTokenService.getTokensByRoomId(room.id).pipe(
    switchMap((tokens) => {
      if (tokens.length < 1) {
        translateService
          .get('bonus-archive-export.no-data')
          .subscribe((text) => notificationService.show(text));
        return null;
      }
      return forkJoin(
        tokens.map((token) => commentService.getComment(token.commentId)),
      ).pipe(
        switchMap((comments) => {
          const filteredComments = new Set(
            comments
              .filter((v) => v?.creatorId)
              .map((comment) => comment.creatorId),
          );
          return moderatorService.getUserData([...filteredComments]).pipe(
            map((users) => {
              const fastAccess = {} as Record<string, string>;
              users.forEach((user) => {
                if (user) {
                  fastAccess[user.id] = user['email'];
                }
              });
              return comments.map((c) => [fastAccess[c?.creatorId], c]);
            }),
            catchError(() => {
              return of(comments.map((c) => [undefined, c]));
            }),
          );
        }),
        switchMap((arr: [userId: string, c: Comment][]) => {
          arr.sort(([, a], [, b]) => numberSorter(a?.number, b?.number));
          const data: BonusArchiveEntry[] = arr.map(([loginId, c], i) => ({
            question: c?.body,
            bonusToken: tokens[i].token,
            bonusTimestamp: tokens[i].createdAt,
            bonusQuestionNumber: c?.number,
            userLoginId: loginId,
          }));
          const date = new Date();
          return bonusArchiveImportExport(translateService)
            .exportToCSV([date.toLocaleString(), room.name, room.shortId, data])
            .pipe(
              map(
                (text) => [text, date.toLocaleDateString()] as [string, string],
              ),
            );
        }),
      );
    }),
  );

export const ImportedCommentFields = [
  'number',
  'createdAt',
  'body',
  'tag',
  'keywordsFromQuestioner',
  'questionerName',
  'creatorId',
  'upvotes',
  'downvotes',
  'score',
  'ack',
  'correct',
  'bookmark',
  'favorite',
  'roomId',
] as const;

export type ImportedComment = Pick<
  Comment,
  (typeof ImportedCommentFields)[number]
>;

const roomImportExport = (
  translateService: TranslateService,
  actualRole: UserRole,
  translatePath: string,
  user?: User,
  room?: Room,
  moderatorIds?: Set<string>,
) => {
  const empty = translatePath + '.export-empty';
  const bufferedIds = [];
  const isMod = actualRole > UserRole.PARTICIPANT;
  return new ImportExportManager(translateService, [
    { type: 'value', languageKey: translatePath + '.room-name' },
    { type: 'value', languageKey: translatePath + '.room-code' },
    { type: 'value', languageKey: translatePath + '.room-export-date' },
    {
      type: 'value',
      languageKey: translatePath + '.room-welcome',
    },
    {
      type: 'value',
      languageKey: translatePath + '.room-categories',
      additionalLanguageKeys: [empty],
      valueMapper: {
        export: (cfg, val) =>
          (val as string[])?.length
            ? serializeStringArray(val as string[])
            : cfg.additional[0],
        import: (cfg, val) =>
          val === cfg.additional[0] ? [] : deserializeStringArray(val),
      },
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
              return new Comment({ number: val });
            },
          },
        },
        {
          languageKey: translatePath + '.timestamp',
          valueMapper: {
            export: (cfg, c) => serializeDate(c.createdAt),
            import: (cfg, val, prev) => {
              prev.createdAt = deserializeDate(val);
              return prev;
            },
          },
        },
        {
          languageKey: translatePath + '.question',
          valueMapper: {
            export: (cfg, c) => c.body,
            import: (cfg, val, prev) => {
              prev.body = val;
              return prev;
            },
          },
        },
        {
          languageKey: translatePath + '.chosen-category',
          valueMapper: {
            export: (cfg, val) => val.tag || '',
            import: (cfg, val, c) => {
              c.tag = val ? val : null;
              return c;
            },
          },
        },
        {
          languageKey: translatePath + '.chosen-keywords',
          additionalLanguageKeys: [empty],
          valueMapper: {
            export: (cfg, val) =>
              val.keywordsFromQuestioner?.length
                ? serializeStringArray(
                    val.keywordsFromQuestioner.map((word) => word.text),
                  )
                : cfg.additional[0],
            import: (cfg, val, c) => {
              c.keywordsFromQuestioner =
                val === cfg.additional[0]
                  ? []
                  : deserializeStringArray(val).map((v) => {
                      return {
                        text: v,
                        dep: ['ROOT'],
                      };
                    });
              return c;
            },
          },
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
            import: (cfg, val, c) => c,
          },
        },
        {
          languageKey: translatePath + '.user-name',
          valueMapper: {
            export: (cfg, c) => c.questionerName,
            import: (cfg, val, c) => {
              c.questionerName = val;
              return c;
            },
          },
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
              c.creatorId = val as UUID;
              return c;
            },
          },
        },
        {
          languageKey: translatePath + '.upvotes',
          valueMapper: {
            export: (cfg, c) => String(c.upvotes),
            import: (cfg, val, c) => {
              c.upvotes = parseInt(val, 10);
              return c;
            },
          },
        },
        {
          languageKey: translatePath + '.downvotes',
          valueMapper: {
            export: (cfg, c) => String(c.downvotes),
            import: (cfg, val, c) => {
              c.downvotes = parseInt(val, 10);
              return c;
            },
          },
        },
        {
          languageKey: translatePath + '.score',
          valueMapper: {
            export: (cfg, c) => String(c.score),
            import: (cfg, val, c) => {
              c.score = parseInt(val, 10);
              return c;
            },
          },
        },
        {
          languageKey: translatePath + '.public/moderated',
          additionalLanguageKeys: [
            translatePath + '.comment-acked',
            translatePath + '.comment-refused',
          ],
          valueMapper: {
            export: (cfg, c) => cfg.additional[c.ack ? 0 : 1],
            import: (cfg, val, c) => {
              c.ack = val === cfg.additional[0];
              return c;
            },
          },
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
              } else if (
                val === cfg.additional[translatePath + '.comment-wrong']
              ) {
                c.correct = CorrectWrong.WRONG;
              } else {
                c.correct = CorrectWrong.NULL;
              }
              return c;
            },
          },
        },
        {
          languageKey: translatePath + '.bookmark',
          additionalLanguageKeys: [
            translatePath + '.comment-bookmarked',
            translatePath + '.comment-not_bookmarked',
          ],
          valueMapper: {
            export: (cfg, c) => cfg.additional[c.bookmark ? 0 : 1],
            import: (cfg, val, c) => {
              c.bookmark = val === cfg.additional[0];
              return c;
            },
          },
        },
        {
          languageKey: translatePath + '.token',
          valueMapper: {
            export: (cfg, c) =>
              c.bonusToken && (isMod || c.creatorId === user?.id)
                ? c.bonusToken
                : '',
            import: (cfg, val, c) => {
              c.bonusToken = val;
              return c;
            },
          },
        },
        {
          languageKey: translatePath + '.token-time',
          valueMapper: {
            export: (cfg, c) =>
              c.bonusTimeStamp && (isMod || c.creatorId === user?.id)
                ? serializeDate(c.bonusTimeStamp as unknown as string)
                : '',
            import: (cfg, val, c) => {
              c.bonusTimeStamp = (val
                ? Date.parse(val)
                : '') as unknown as Date;
              return c;
            },
          },
        },
      ],
    } as ExportTable<CommentBonusTokenMixin>,
  ]);
};

export const exportBrainstorming = (
  translateService: TranslateService,
  actualRole: UserRole,
  notificationService: NotificationService,
  bonusTokenService: BonusTokenService,
  commentService: CommentService,
  translatePath: string,
  user: User,
  room: Room,
  moderatorIds: Set<string>,
): Observable<[string, string]> =>
  commentService.getAckComments(room.id).pipe(
    switchMap((res) => {
      if (actualRole > UserRole.PARTICIPANT) {
        return commentService
          .getRejectedComments(room.id)
          .pipe(map((comments) => [res, comments]));
      }
      return of([res, []]);
    }),
    switchMap((res) => {
      const comments = [...res[0], ...res[1]].filter(
        (c) => c.brainstormingSessionId !== null,
      ) as CommentBonusTokenMixin[];
      if (comments.length < 1) {
        translateService
          .get(translatePath + '.no-comments')
          .subscribe((msg) => {
            notificationService.show(msg);
          });
        return null;
      }
      comments.sort((a, b) => numberSorter(a.number, b.number));
      return bonusTokenService.getTokensByRoomId(room.id).pipe(
        switchMap((value) => {
          for (const comment of comments) {
            const bonusToken = value.find(
              (v) =>
                v.accountId === comment.creatorId && v.commentId === comment.id,
            );
            if (bonusToken) {
              comment.bonusToken = bonusToken.token;
              comment.bonusTimeStamp = bonusToken.createdAt;
            }
          }
          const dateString = new Date().toLocaleDateString();
          return roomImportExport(
            translateService,
            actualRole,
            translatePath,
            user,
            room,
            moderatorIds,
          )
            .exportToCSV([
              room.name,
              room.shortId,
              dateString,
              room.description,
              room.tags,
              comments,
            ])
            .pipe(map((data) => [data, dateString] as [string, string]));
        }),
      );
    }),
  );

export const exportRoom = (
  translateService: TranslateService,
  actualRole: UserRole,
  notificationService: NotificationService,
  bonusTokenService: BonusTokenService,
  commentService: CommentService,
  translatePath: string,
  user: User,
  room: Room,
  moderatorIds: Set<string>,
): Observable<[string, string]> =>
  commentService.getAckComments(room.id).pipe(
    switchMap((res) => {
      if (actualRole > UserRole.PARTICIPANT) {
        return commentService
          .getRejectedComments(room.id)
          .pipe(map((comments) => [res, comments]));
      }
      return of([res, []]);
    }),
    switchMap((res) => {
      const comments = [...res[0], ...res[1]] as CommentBonusTokenMixin[];
      if (comments.length < 1) {
        translateService
          .get(translatePath + '.no-comments')
          .subscribe((msg) => {
            notificationService.show(msg);
          });
        return null;
      }
      comments.sort((a, b) => numberSorter(a.number, b.number));
      return bonusTokenService.getTokensByRoomId(room.id).pipe(
        switchMap((value) => {
          for (const comment of comments) {
            const bonusToken = value.find(
              (v) =>
                v.accountId === comment.creatorId && v.commentId === comment.id,
            );
            if (bonusToken) {
              comment.bonusToken = bonusToken.token;
              comment.bonusTimeStamp = bonusToken.createdAt;
            }
          }
          const dateString = new Date().toLocaleDateString();
          return roomImportExport(
            translateService,
            actualRole,
            translatePath,
            user,
            room,
            moderatorIds,
          )
            .exportToCSV([
              room.name,
              room.shortId,
              dateString,
              room.description,
              room.tags,
              comments,
            ])
            .pipe(map((data) => [data, dateString] as [string, string]));
        }),
      );
    }),
  );

export type ImportQuestionsResult = [
  roomName: string,
  roomShortId: string,
  exportDate: string,
  roomDescription: string,
  roomTags: string[],
  comments: CommentBonusTokenMixin[],
];

const generateCommentCreatorIds = (
  observer: Observable<ImportQuestionsResult>,
  roomService: RoomService,
  roomId: UUID,
): Observable<ImportQuestionsResult> =>
  observer.pipe(
    mergeMap((value) => {
      value[5] = value[5].filter((c) => c.creatorId);
      const userSet = new Set<string>(value[5].map((c) => c.creatorId));
      const fastAccess = {} as Record<string, number>;
      [...userSet].forEach((user, index) => (fastAccess[user] = index));
      return roomService.createGuestsForImport(roomId, userSet.size).pipe(
        map((guestIds) => {
          value[5].forEach((c) => {
            c.creatorId = guestIds[fastAccess[c.creatorId]] as UUID;
          });
          return value;
        }),
      );
    }),
  );

const importRoomSettings = (
  value: ImportQuestionsResult,
  roomService: RoomService,
  roomId: string,
): Observable<ImportQuestionsResult> =>
  roomService
    .patchRoom(roomId, {
      name: value[0],
      description: value[3],
      tags: value[4],
    })
    .pipe(map(() => value));

const importComments = (
  comments: CommentBonusTokenMixin[],
  roomId: UUID,
  commentService: CommentService,
): Observable<Comment[]> => {
  const importedComments = comments.map((c) => {
    const { bonusToken, bonusTimeStamp, ...realComment } = c;
    realComment.roomId = roomId;
    if (bonusToken && bonusTimeStamp) {
      realComment.favorite = true;
    }
    return realComment;
  });
  return commentService.importComments(importedComments);
};

export const importToRoom = (
  translateService: TranslateService,
  actualRole: UserRole,
  roomId: UUID,
  roomService: RoomService,
  commentService: CommentService,
  translatePath: string,
  csv: string,
): Observable<ImportQuestionsResult> => {
  const result = roomImportExport(
    translateService,
    actualRole,
    translatePath,
  ).importFromCSV(csv) as Observable<ImportQuestionsResult>;
  return generateCommentCreatorIds(result, roomService, roomId).pipe(
    mergeMap((value) => importRoomSettings(value, roomService, roomId)),
    mergeMap((value) => importComments(value[5], roomId, commentService)),
    mergeMap(() => result),
  );
};
