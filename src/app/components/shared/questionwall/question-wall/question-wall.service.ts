import { EventEmitter, Injectable } from '@angular/core';
import { Comment } from '../../../../models/comment';
import { User } from '../../../../models/user';
import { CommentListSupport } from './comment-list-support';
import { SessionService } from '../../../../services/util/session.service';
import { Room } from '../../../../models/room';
import { Moderator } from '../../../../models/moderator';
import { ObjectMap } from '../../../../models/object-map';
import {
  BehaviorSubject,
  filter,
  forkJoin,
  Observable,
  of,
  ReplaySubject,
  take,
  takeUntil,
} from 'rxjs';
import { Period, SortType } from '../../../../utils/data-filter-object.lib';
import { user$ } from 'app/user/state/user';
import { DefaultSliderConfig } from './qw-config';
import { RunningNumberMarker } from './support-components/qw-running-number-background/qw-running-number-background.component';
import { VoteService } from 'app/services/http/vote.service';
import {
  afterUpdate,
  UIComment,
  uiComments,
} from 'app/room/state/comment-updates';

export type AdjacentComments = [UIComment | undefined, UIComment | undefined];

export interface QuestionWallSession {
  qrcode: boolean;
  autofocus: boolean;
  user: User;
  room: Room;
  moderators: Moderator[];
  commentsCountQuestions: number;
  commentsCountUsers: number;
  comments: UIComment[];
  filter: CommentListSupport;
  focus: BehaviorSubject<Comment | undefined>;
  destroyer: ReplaySubject<1>;
  period: Period;
  filterChangeListener: EventEmitter<void>;
  onInit: BehaviorSubject<boolean>;
  focusScale: BehaviorSubject<number>;
  readonly adjacentComments: AdjacentComments;
  // comment.userID -> this
  userContext: ObjectMap<{
    marker: RunningNumberMarker | undefined;
    userUID: string;
  }>;

  /**
   * filter on the comment stream for given comment's replies.
   * @param destroyer
   * @param comment
   */
  generateCommentReplyStream(
    destroyer: ReplaySubject<1>,
    comment: UIComment,
  ): BehaviorSubject<UIComment[]>;
}

@Injectable({
  providedIn: 'root',
})
export class QuestionWallService {
  private readonly _session: BehaviorSubject<QuestionWallSession | undefined> =
    new BehaviorSubject(undefined);

  constructor(
    private readonly sessionService: SessionService,
    private readonly voteService: VoteService,
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
    this.voteService.voteUp(comment, this.session.user.id).subscribe();
  }

  dislike(comment: Comment) {
    this.voteService.voteDown(comment, this.session.user.id).subscribe();
  }

  createSession(
    support: CommentListSupport,
    destroyer: ReplaySubject<1>,
  ): QuestionWallSession {
    // newest comments first as default sort
    support.sort(SortType.Time, false);
    // todo(lph) change to signals later!
    const filterChangeListener = new EventEmitter();
    const onCommentAddListener = new EventEmitter<Comment>();
    ///
    const onInit = new BehaviorSubject<boolean>(false);
    const focus = new BehaviorSubject<Comment | undefined>(undefined);
    let filteredComments: UIComment[] = [];
    let commentsCountQuestions: number = 0;
    let commentsCountUsers: number = 0;
    let user: User;
    let room: Room;
    let moderators: Moderator[];
    let autofocus = false;
    const userContext: QuestionWallSession['userContext'] = {};
    const userSet: string[] = [];
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
      user$.pipe(take(1)),
      this.sessionService.getModeratorsOnce(),
      this.sessionService.onReady,
    ]).subscribe(initializeSession);
    const session: QuestionWallSession = {
      destroyer: destroyer,
      filter: support,
      focus: focus,
      filterChangeListener: filterChangeListener,
      focusScale: new BehaviorSubject(DefaultSliderConfig._default),
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
      userContext: userContext,
      qrcode: false,
      adjacentComments: adjacentComments,
      onInit: onInit,
      generateCommentReplyStream: generateCommentReplyStream,
    };
    this._session.next(session);
    return session;

    function generateCommentReplyStream(
      destroyer: ReplaySubject<1>,
      c: UIComment,
    ): BehaviorSubject<UIComment[]> {
      const comment = uiComments().fastAccess[c.comment.id];
      const stream = new BehaviorSubject([...comment.children]);
      onCommentAddListener
        .pipe(takeUntil(destroyer))
        .subscribe((newComment) => {
          if (newComment.commentReference === comment.comment.id) {
            const newC = Array.from(comment.children.values()).find(
              (e) => (e.comment.id = newComment.id),
            );
            stream.next([...stream.value, newC]);
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
      afterUpdate
        .pipe(filter((e) => e.type === 'CommentCreated'))
        .subscribe((c) => {
          const date = new Date(c.comment.createdAt);
          commentCache[c.comment.id] = {
            date,
            old: false,
          };
          onCommentAddListener.emit(c.comment);
          if (autofocus && !c.comment.commentReference) {
            focus.next(c.comment);
          }
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
      adjacentComments[0] = undefined;
      adjacentComments[1] = undefined;
      const found =
        currentFocus &&
        filteredComments.findIndex((c) => c.comment.id === currentFocus.id);
      if (typeof found === 'number' && found >= 0) {
        adjacentComments[0] = filteredComments[found - 1];
        adjacentComments[1] = filteredComments[found + 1];
      }
      if (adjacentComments[0] === undefined) {
        adjacentComments[0] = filteredComments[filteredComments.length - 1];
      }
      if (adjacentComments[1] === undefined) {
        adjacentComments[1] = filteredComments[0];
      }
    }

    function revalidateFilterChange() {
      filteredComments = [...support.filteredDataAccess.getCurrentData()];
      const filter = support.filteredDataAccess.dataFilter;
      period = filter.period;
      const tempUserSet = new Set<string>();
      for (let i = 0; i < filteredComments.length; i++) {
        const comment = filteredComments[i];
        tempUserSet.add(comment.comment.creatorId);
        let userSetIndex = userSet.indexOf(comment.comment.creatorId);
        if (userSetIndex === -1) {
          userSetIndex = userSet.length;
          userSet.push(comment.comment.creatorId);
        }
        userContext[comment.comment.creatorId] = {
          marker: getRunningNumberMarker(comment.comment),
          userUID: userSetIndex + 1 + '',
        };
        if (commentCache[comment.comment.id]) {
          continue;
        }
        const date = new Date(comment.comment.createdAt);
        commentCache[comment.comment.id] = {
          date,
          old: true,
        };
      }
      commentsCountQuestions = filteredComments.length;
      commentsCountUsers = tempUserSet.size;
      revalidateAdjacentComments();
    }

    function getRunningNumberMarker(
      comment: Comment,
    ): RunningNumberMarker | undefined {
      if (comment.creatorId === session.room.ownerId) {
        return 'moderator';
      }
      return undefined;
    }
  }
}
