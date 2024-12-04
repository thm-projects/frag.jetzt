import { Bookmark } from 'app/models/bookmark';
import { BookmarkService } from 'app/services/http/bookmark.service';
import { computedResource } from 'app/utils/computed-resource';
import { map } from 'rxjs';
import { room } from './room';
import { user } from 'app/user/state/user';
import { Vote } from 'app/models/vote';
import { VoteService } from 'app/services/http/vote.service';
import { CommentService } from 'app/services/http/comment.service';
import { computed, inject } from '@angular/core';

// comments - fetching

export const comments = computedResource({
  request: () => room.value()?.id,
  loader: (params) => inject(CommentService).getAckComments(params.request),
});

// comment meta

interface UserCountEntry {
  overall: number;
  topLevel: number;
}

export const commentsMeta = computed(() => {
  const userCount = new Map<string, UserCountEntry>();
  const elems = comments.value();
  if (!elems) {
    return {
      userCount,
    };
  }
  for (const c of elems) {
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

export const userBookmarks = computedResource({
  request: () => {
    const r = room.value();
    const u = user();
    if (!r || !u) return undefined;
    return r.id;
  },
  loader: (params) =>
    inject(BookmarkService)
      .getByRoomId(params.request)
      .pipe(
        map((bookmarks) => {
          const result = new Map<string, Bookmark>();
          for (const bookmark of bookmarks) {
            result.set(bookmark.commentId, bookmark);
          }
          return result;
        }),
      ),
});

// userVotes - fetching

export const userVotes = computedResource({
  request: () => {
    const r = room.value();
    const u = user();
    if (!r || !u) return undefined;
    return [r.id, u.id] as const;
  },
  loader: (params) =>
    inject(VoteService)
      .getByRoomIdAndUserID(params.request[0], params.request[1])
      .pipe(
        map((votes) => {
          const result = new Map<string, Vote>();
          for (const vote of votes) {
            result.set(vote.commentId, vote);
          }
          return result;
        }),
      ),
});
