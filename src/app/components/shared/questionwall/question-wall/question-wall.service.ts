import { EventEmitter, Injectable } from '@angular/core';
import { ForumComment } from '../../../../utils/data-accessor';
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
    // todo(lph) change to signals later!
    const filterChangeListener = new EventEmitter();
    const onInit = new BehaviorSubject<boolean>(false);
    const focus = new BehaviorSubject<ForumComment | undefined>(undefined);
    let comments: ForumComment[] = [];
    let commentsCountQuestions: number = 0;
    let commentsCountUsers: number = 0;
    let user: User;
    let room: Room;
    let moderators: Moderator[];
    const adjacentComments: AdjacentComments = [undefined, undefined];
    const commentCache: ObjectMap<{
      date: Date;
      old: boolean;
    }> = {};
    let period: Period;
    let firstPass = true;
    focus.subscribe(() => {
      revalidateAdjacentComments();
    });
    forkJoin([
      this.sessionService.getRoomOnce(),
      this.accountState.user$.pipe(take(1)),
      this.sessionService.getModeratorsOnce(),
      this.sessionService.onReady,
    ]).subscribe(([_room, _user, _moderators]) => {
      room = _room;
      user = _user;
      moderators = _moderators;
      support.filteredDataAccess.attach({
        moderatorIds: new Set<string>(moderators.map((m) => m.accountId)),
        userId: user.id,
        threshold: room.threshold,
        ownerId: room.ownerId,
        roomId: room.id,
      });
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
      this.sessionService
        .getRoomOnce()
        .pipe(
          mergeMap(() =>
            this.roomDataService.dataAccessor.receiveUpdates([
              { type: 'CommentCreated' },
            ]),
          ),
        )
        .subscribe((c) => {
          if (c.finished) {
            // if (this.focusIncomingComments) {
            //   this.focusComment(c.comment);
            // }
            return;
          }
          // this.unreadComments++;
          const date = new Date(c.comment.createdAt);
          commentCache[c.comment.id] = {
            date,
            old: false,
          };
        });
    });
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
        return comments;
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
      autofocus: false,
      qrcode: false,
      adjacentComments: adjacentComments,
      onInit: onInit,
    };
    this._session.next(session);
    return session;

    function revalidateAdjacentComments() {
      if (!focus.value) {
        adjacentComments[0] = undefined;
        adjacentComments[1] = undefined;
      }
      for (let i = 0; i < comments.length; i++) {
        const comment = comments[i];
        if (comment.id === focus.value.id) {
          adjacentComments[0] = comments[i - 1];
          adjacentComments[1] = comments[i + 1];
          return;
        }
      }
    }

    function revalidateFilterChange() {
      comments = [...support.filteredDataAccess.getCurrentData()];
      const filter = support.filteredDataAccess.dataFilter;
      period = filter.period;
      const tempUserSet = new Set<string>();
      for (let i = 0; i < comments.length; i++) {
        const comment = comments[i];
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
      commentsCountQuestions = comments.length;
      commentsCountUsers = tempUserSet.size;
      revalidateAdjacentComments();
    }
  }
}
