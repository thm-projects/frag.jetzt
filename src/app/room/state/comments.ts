import { getInjector } from 'app/base/angular-init';
import { Bookmark } from 'app/models/bookmark';
import { Room } from 'app/models/room';
import { BookmarkService } from 'app/services/http/bookmark.service';
import { fetchingSignal } from 'app/utils/fetching-signal';
import { map, of, switchMap } from 'rxjs';
import { room } from './room';
import { user } from 'app/user/state/user';
import { Vote } from 'app/models/vote';
import { VoteService } from 'app/services/http/vote.service';
import { CommentService } from 'app/services/http/comment.service';
import { Comment } from 'app/models/comment';
import { computed } from '@angular/core';
import { User } from 'app/models/user';

// comments - fetching

export const comments = fetchingSignal<Room, Comment[]>({
  initialState: null,
  fetchingState: () => null,
  fetch: (room) => {
    if (!room) {
      return of(null);
    }
    // TODO: Stream
    return getInjector().pipe(
      switchMap((injector) =>
        injector.get(CommentService).getAckComments(room.id),
      ),
    );
  },
  provider: room,
});

// comment meta

interface UserCountEntry {
  overall: number;
  topLevel: number;
}

export const commentsMeta = computed(() => {
  const userCount = new Map<string, UserCountEntry>();
  const elems = comments();
  if (!elems) {
    return {
      userCount,
    };
  }
  for (const c of comments()) {
    let obj: UserCountEntry;
    if (userCount.has(c.creatorId)) {
      obj = userCount.get(c.creatorId);
    } else {
      obj = { overall: 0, topLevel: 0 };
      userCount.set(c.creatorId, obj);
    }
    obj.overall += 1;
    if (!c.number.includes('/')) {
      obj.topLevel += 1;
    }
  }
  return {
    userCount,
  };
});

// userBookmarks - fetching

export const userBookmarks = fetchingSignal<
  [Room, User],
  Map<string, Bookmark>
>({
  initialState: null,
  fetchingState: () => null,
  fetch: ([room, user]) => {
    if (!room || !user) {
      return of(null);
    }
    return getInjector().pipe(
      switchMap((injector) =>
        injector.get(BookmarkService).getByRoomId(room.id),
      ),
      map((bookmarks) => {
        const result = new Map<string, Bookmark>();
        for (const bookmark of bookmarks) {
          result.set(bookmark.commentId, bookmark);
        }
        return result;
      }),
    );
  },
  provider: computed(() => [room(), user()]),
});

// userVotes - fetching

export const userVotes = fetchingSignal<[Room, User], Map<string, Vote>>({
  initialState: null,
  fetchingState: () => null,
  fetch: ([room, user]) => {
    if (!room || !user) {
      return of(null);
    }
    return getInjector().pipe(
      switchMap((injector) =>
        injector.get(VoteService).getByRoomIdAndUserID(room.id, user.id),
      ),
      map((votes) => {
        const result = new Map<string, Vote>();
        for (const vote of votes) {
          result.set(vote.commentId, vote);
        }
        return result;
      }),
    );
  },
  provider: computed(() => [room(), user()]),
});
