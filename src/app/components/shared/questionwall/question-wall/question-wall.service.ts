import { EventEmitter, Injectable } from '@angular/core';
import {
  ForumComment,
  UpdateInformation,
} from '../../../../utils/data-accessor';
import { Comment } from '../../../../models/comment';
import { CommentService } from '../../../../services/http/comment.service';
import { User } from '../../../../models/user';
import { CommentListSupport } from './comment-list-support';
import { SessionService } from '../../../../services/util/session.service';
import { Room } from '../../../../models/room';
import { AccountStateService } from '../../../../services/state/account-state.service';
import { Moderator } from '../../../../models/moderator';
import { ObjectMap } from '../../../../models/object-map';
import { RoomDataService } from '../../../../services/util/room-data.service';
import {
  BehaviorSubject,
  filter,
  forkJoin,
  mergeMap,
  Observable,
  of,
  ReplaySubject,
  take,
  takeUntil,
} from 'rxjs';
import { Period } from '../../../../utils/data-filter-object.lib';

export type AdjacentComments = [
  ForumComment | undefined,
  ForumComment | undefined,
];

export interface QuestionWallSession {
  qrcode: boolean;
  autofocus: boolean;
  user: User;
  room: Room;
  moderators: Moderator[];
  commentsCountQuestions: number;
  commentsCountUsers: number;
  comments: ForumComment[];
  filter: CommentListSupport;
  focus: BehaviorSubject<ForumComment | undefined>;
  destroyer: ReplaySubject<1>;
  period: Period;
  filterChangeListener: EventEmitter<void>;
  onInit: BehaviorSubject<boolean>;
  readonly adjacentComments: AdjacentComments;

  generateCommentReplyStream(
    destroyer: ReplaySubject<1>,
    comment: ForumComment,
  ): BehaviorSubject<ForumComment[]>;
}

@Injectable({
  providedIn: 'root',
})
export class QuestionWallService {
  private readonly _session: BehaviorSubject<QuestionWallSession | undefined> =
    new BehaviorSubject(undefined);

  constructor(
    private readonly commentService: CommentService,
    private readonly sessionService: SessionService,
    private readonly accountState: AccountStateService,
    private readonly roomDataService: RoomDataService,
  ) {}

  get session(): QuestionWallSession | undefined {
    return this._session.value;
  }

  getSession(): Observable<QuestionWallSession> {
    if (this._session.value) {
      return of(this._session.value);
    } else {
      return this._session.pipe(filter((session) => !!session)).pipe(take(1));
    }
  }

  like(comment: Comment) {
    this.commentService.voteUp(comment, this.session.user.id).subscribe();
  }

  dislike(comment: Comment) {
    this.commentService.voteDown(comment, this.session.user.id).subscribe();
  }

  getAnswers() {}

  createSession(
    support: CommentListSupport,
    destroyer: ReplaySubject<1>,
  ): QuestionWallSession {
    const sessionService: SessionService = this.sessionService;
    const roomDataService: RoomDataService = this.roomDataService;
    // todo(lph) change to signals later!
    const filterChangeListener = new EventEmitter();
    const onCommentAddListener = new EventEmitter<ForumComment>();
    ///
    const onInit = new BehaviorSubject<boolean>(false);
    const focus = new BehaviorSubject<ForumComment | undefined>(undefined);
    let filteredComments: ForumComment[] = [];
    let commentsCountQuestions: number = 0;
    let commentsCountUsers: number = 0;
    let user: User;
    let room: Room;
    let moderators: Moderator[];
    let autofocus = false;
    const adjacentComments: AdjacentComments = [undefined, undefined];
    const commentCache: ObjectMap<{
      date: Date;
      old: boolean;
    }> = {};
    let period: Period;
    let firstPass = true;
    focus.subscribe(() => revalidateAdjacentComments());
    forkJoin([
      this.sessionService.getRoomOnce(),
      this.accountState.user$.pipe(take(1)),
      this.sessionService.getModeratorsOnce(),
      this.sessionService.onReady,
    ]).subscribe(initializeSession);
    const session = {
      destroyer: destroyer,
      filter: support,
      focus: focus,
      filterChangeListener: filterChangeListener,
      get commentsCountUsers() {
        return commentsCountUsers;
      },
      get commentsCountQuestions() {
        return commentsCountQuestions;
      },
      get comments() {
        return filteredComments;
      },
      get period() {
        return period;
      },
      get room() {
        return room;
      },
      get user() {
        return user;
      },
      get moderators() {
        return moderators;
      },
      get autofocus() {
        return autofocus;
      },
      set autofocus(value: boolean) {
        autofocus = value;
      },
      qrcode: false,
      adjacentComments: adjacentComments,
      onInit: onInit,
      generateCommentReplyStream: generateCommentReplyStream,
    };
    this._session.next(session);
    return session;

    function generateCommentReplyStream(
      destroyer: ReplaySubject<1>,
      comment: ForumComment,
    ): BehaviorSubject<ForumComment[]> {
      const stream = new BehaviorSubject([...comment.children]);
      onCommentAddListener
        .pipe(takeUntil(destroyer))
        .subscribe((newComment) => {
          if (newComment.commentReference === comment.id) {
            stream.next([...stream.value, newComment]);
          }
        });
      return stream;
    }

    function initializeSession([_room, _user, _moderators]: [
      Room,
      User,
      Moderator[],
      void,
    ]) {
      room = _room;
      user = _user;
      moderators = _moderators;
      attachToFilteredDataAccess();
      initializeFilteredDataChange();
      sessionService
        .getRoomOnce()
        .pipe(
          mergeMap(() =>
            roomDataService.dataAccessor.receiveUpdates([
              { type: 'CommentCreated' },
            ]),
          ),
        )
        .subscribe((c: UpdateInformation) => {
          onCommentAddListener.emit(c.comment);
          if (c.finished) {
            if (autofocus && !c.comment.commentReference) {
              focus.next(c.comment);
            }
            return;
          }
          // this.unreadComments++;
          const date = new Date(c.comment.createdAt);
          commentCache[c.comment.id] = {
            date,
            old: false,
          };
        });
    }

    function initializeFilteredDataChange() {
      support.filteredDataAccess
        .getFilteredData()
        .pipe(takeUntil(destroyer))
        .subscribe(() => {
          revalidateFilterChange();
          filterChangeListener.emit();
          if (firstPass) {
            firstPass = false;
            onInit.next(true);
          }
        });
    }

    function attachToFilteredDataAccess() {
      support.filteredDataAccess.attach({
        moderatorIds: new Set<string>(moderators.map((m) => m.accountId)),
        userId: user.id,
        threshold: room.threshold,
        ownerId: room.ownerId,
        roomId: room.id,
      });
    }

    function revalidateAdjacentComments() {
      const currentFocus = focus.value;
      if (!currentFocus) {
        adjacentComments[0] = undefined;
        adjacentComments[1] = undefined;
      } else {
        for (let i = 0; i < filteredComments.length; i++) {
          const comment = filteredComments[i];
          if (comment.id === currentFocus.id) {
            adjacentComments[0] = filteredComments[i - 1];
            adjacentComments[1] = filteredComments[i + 1];
            return;
          }
        }
      }
    }

    function revalidateFilterChange() {
      filteredComments = [...support.filteredDataAccess.getCurrentData()];
      const filter = support.filteredDataAccess.dataFilter;
      period = filter.period;
      const tempUserSet = new Set<string>();
      for (let i = 0; i < filteredComments.length; i++) {
        const comment = filteredComments[i];
        tempUserSet.add(comment.creatorId);
        if (commentCache[comment.id]) {
          continue;
        }
        const date = new Date(comment.createdAt);
        commentCache[comment.id] = {
          date,
          old: true,
        };
      }
      // this.refreshUserMap();
      commentsCountQuestions = filteredComments.length;
      commentsCountUsers = tempUserSet.size;
      revalidateAdjacentComments();
    }
  }
}
