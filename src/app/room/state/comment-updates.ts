import {
  computed,
  effect,
  EventEmitter,
  signal,
  WritableSignal,
} from '@angular/core';
import { getInjector } from 'app/base/angular-init';
import { filter, Subscription, switchMap } from 'rxjs';
import { room } from './room';
import { WsCommentService } from 'app/services/websockets/ws-comment.service';
import { user } from 'app/user/state/user';
import { RoomStateService } from 'app/services/state/room-state.service';
import { UserRole } from 'app/models/user-roles.enum';
import { RoomCountChanged } from 'app/services/http/active-user.service';
import { Comment } from 'app/models/comment';
import { comments, moderatedComments } from './comments';
import { CommentService } from 'app/services/http/comment.service';
import { makeMeta } from '../util/comment-utility';

// Deletions

export interface UICallbackObject {
  allowDelete: () => void;
}

interface InternalUICallbackObject extends UICallbackObject {
  allowed: boolean;
  commentId: Comment['id'];
  type: 'normal' | 'moderated' | null;
}

const registeredUICallbacks: {
  [key: Comment['id']]: {
    target: 'normal' | 'moderated' | null;
    callbacks: InternalUICallbackObject[];
  };
} = {};

// Comment updates

interface DeleteComment {
  type: 'CommentDeleted';
  id: Comment['id'];
  comment: Comment;
}

interface CreateComment {
  type: 'CommentCreated';
  comment: Comment;
}

interface HighlightComment {
  type: 'CommentHighlighted';
  id: Comment['id'];
  lights: boolean;
}

export interface PatchComment {
  type: 'CommentPatched';
  id: Comment['id'];
  comment: Comment;
  changes: Record<string, unknown>;
}

export type CommentUpdate =
  | DeleteComment
  | CreateComment
  | HighlightComment
  | PatchComment;

export interface AnswerCount {
  participants: number;
  moderators: number;
  creator: number;
}

export interface UIComment {
  comment: Comment;
  deleting: boolean;
  highlighted: boolean;
  children: Set<UIComment>;
  parent: UIComment;
  answerCount: AnswerCount;
  totalAnswerCount: AnswerCount;
}

const createUIComment = (
  comment: Comment,
  lights: Set<Comment['id']>,
  deleting = false,
) => {
  return {
    comment,
    highlighted: lights.has(comment.id),
    deleting,
    children: new Set(),
    parent: null,
    answerCount: {
      participants: 0,
      moderators: 0,
      creator: 0,
    },
    totalAnswerCount: {
      participants: 0,
      moderators: 0,
      creator: 0,
    },
  } satisfies UIComment;
};

// comment
export const beforeUpdate = new EventEmitter<CommentUpdate>();
export const afterUpdate = new EventEmitter<CommentUpdate>();
const scheduledDeletions = signal<Comment[]>([]);
const highlightedComments = signal<Set<Comment['id']>>(new Set());
export const uiComments = computed(() => {
  const c = comments.value();
  if (!c) return null;
  const lights = highlightedComments();
  return makeMeta([
    ...c.map((comment) => createUIComment(comment, lights)),
    ...scheduledDeletions().map((comment) =>
      createUIComment(comment, lights, true),
    ),
  ] satisfies UIComment[]);
});

// moderatedComments
export const beforeUpdateModerated = new EventEmitter<CommentUpdate>();
export const afterUpdateModerated = new EventEmitter<CommentUpdate>();
const scheduledDeletionsModerated = signal<Comment[]>([]);
const highlightedCommentsModerated = signal<Set<Comment['id']>>(new Set());
export const uiModeratedComments = computed(() => {
  const c = moderatedComments.value();
  if (!c) return null;
  const lights = highlightedCommentsModerated();
  return makeMeta([
    ...c.map((comment) => createUIComment(comment, lights)),
    ...scheduledDeletionsModerated().map((comment) =>
      createUIComment(comment, lights, true),
    ),
  ] satisfies UIComment[]);
});

// general
const roomCountSignal = signal<RoomCountChanged>(null);
export const roomCount = roomCountSignal.asReadonly();

interface Message {
  type: string;
  payload: {
    id: Comment['id'];
    changes?: Record<string, unknown>;
    lights?: boolean;
  };
  RoomCountChanged?: RoomCountChanged;
}

// removal

const checkRemove = (commentId: Comment['id']) => {
  const manageObj = registeredUICallbacks[commentId];
  if (!manageObj) return true;
  const target = manageObj.target;
  if (!target) {
    console.warn('No deletion target for comment', commentId);
    return false;
  }
  if (
    manageObj.callbacks.some(
      (e) => (!e.type || e.type === target) && !e.allowed,
    )
  ) {
    return false;
  }
  manageObj.callbacks.forEach((e) => {
    if (!e.type || e.type === target) {
      e.allowed = false;
    }
  });
  if (target === 'moderated') {
    scheduledDeletionsModerated.update((comments) =>
      comments.filter((c) => c.id !== commentId),
    );
  } else {
    scheduledDeletions.update((comments) =>
      comments.filter((c) => c.id !== commentId),
    );
  }
  return true;
};

const removeComment = (id: Comment['id'], type: 'moderated' | 'normal') => {
  const signal: WritableSignal<Comment[]> =
    type === 'moderated' ? moderatedComments.value : comments.value;
  const beforeSignal =
    type === 'moderated' ? beforeUpdateModerated : beforeUpdate;
  const afterSignal = type === 'moderated' ? afterUpdateModerated : afterUpdate;
  const comment = signal().find((c) => c.id === id);
  if (!comment) {
    console.warn('Tried to delete non-existing comment', id);
    return;
  }
  const manageObj = registeredUICallbacks[id] || {
    callbacks: [],
    target: null,
  };
  manageObj.target = type;
  const canRemove = checkRemove(id);
  beforeSignal.emit({ type: 'CommentDeleted', id, comment });
  if (!canRemove) {
    if (type === 'moderated') {
      scheduledDeletionsModerated.update((comments) => [...comments, comment]);
    } else {
      scheduledDeletions.update((comments) => [...comments, comment]);
    }
  }
  signal.update((comments) => comments.filter((c) => c.id !== id));
  afterSignal.emit({ type: 'CommentDeleted', id, comment });
};

// comment creation

export const createComment = (
  commentId: Comment['id'],
  type: 'moderated' | 'normal',
) => {
  getInjector()
    .pipe(
      switchMap((injector) =>
        injector.get(CommentService).getComment(commentId),
      ),
    )
    .subscribe((c) => {
      beforeUpdate.emit({ type: 'CommentCreated', comment: c });
      if (type === 'moderated') {
        moderatedComments.update((comments) => [...comments, c]);
      } else {
        comments.update((comments) => [...comments, c]);
      }
      afterUpdate.emit({ type: 'CommentCreated', comment: c });
    });
};

// comment patch
const SIMPLE_PATCH_PROPERTIES: Set<keyof Comment> = new Set([
  'read',
  'correct',
  'favorite',
  'score',
  'upvotes',
  'downvotes',
  'tag',
  'approved',
  'bookmark',
  'body',
]);

const patchCommentValue = (
  comment: Comment,
  changeKey: keyof Comment,
  value: unknown,
  type: 'moderated' | 'normal',
) => {
  const isAckChannel = type === 'normal';
  switch (changeKey) {
    case 'keywordsFromSpacy':
    case 'keywordsFromQuestioner':
      comment[changeKey] = JSON.parse(value as string);
      break;
    case 'ack':
      comment.ack = value as boolean;
      if (comment.ack !== isAckChannel) {
        removeComment(comment.id, type);
      }
      break;
    default:
      if (SIMPLE_PATCH_PROPERTIES.has(changeKey)) {
        comment[changeKey] = value as never;
      } else {
        console.error('Unknown comment patch: ' + changeKey);
      }
      break;
  }
};

export const patchComment = (
  commentId: Comment['id'],
  patch: Partial<Comment>,
  type: 'moderated' | 'normal',
) => {
  const signal =
    type === 'moderated' ? moderatedComments.value : comments.value;
  const beforeSignal =
    type === 'moderated' ? beforeUpdateModerated : beforeUpdate;
  const afterSignal = type === 'moderated' ? afterUpdateModerated : afterUpdate;
  const comment = signal().find((c) => c.id === commentId);
  if (!comment) {
    console.warn('Tried to patch non-existing comment', commentId);
    return;
  }
  beforeSignal.emit({
    type: 'CommentPatched',
    comment,
    id: commentId,
    changes: patch,
  });
  for (const [key, value] of Object.entries(patch)) {
    patchCommentValue(comment, key as keyof Comment, value, type);
  }
  afterSignal.emit({
    type: 'CommentPatched',
    comment,
    id: commentId,
    changes: patch,
  });
};

// highlight

export const highlightComment = (
  commentId: Comment['id'],
  lights: boolean,
  type: 'moderated' | 'normal',
) => {
  const signal =
    type === 'moderated' ? highlightedCommentsModerated : highlightedComments;
  const beforeSignal =
    type === 'moderated' ? beforeUpdateModerated : beforeUpdate;
  const afterSignal = type === 'moderated' ? afterUpdateModerated : afterUpdate;
  beforeSignal.emit({
    type: 'CommentHighlighted',
    id: commentId,
    lights,
  });
  signal.update((lightsSet) => {
    if (lights) {
      lightsSet.add(commentId);
    } else {
      lightsSet.delete(commentId);
    }
    return new Set(lightsSet);
  });
  afterSignal.emit({
    type: 'CommentHighlighted',
    id: commentId,
    lights,
  });
};

// general

const handleMessage = (message: unknown, type: 'moderated' | 'normal') => {
  const msg = JSON.parse(message['body']) as Message;
  const payload = msg.payload;
  if (!payload) {
    if ('RoomCountChanged' in msg) {
      roomCountSignal.set(msg.RoomCountChanged);
    }
    return;
  }
  switch (msg.type) {
    case 'CommentCreated':
      createComment(payload.id, type);
      break;
    case 'CommentPatched':
      patchComment(payload.id, payload.changes, type);
      break;
    case 'CommentHighlighted':
      highlightComment(payload.id, payload.lights, type);
      break;
    case 'CommentDeleted':
      removeComment(payload.id, type);
      break;
  }
};

const lastSubscriptions: Subscription[] = [];

getInjector().subscribe((injector) => {
  effect(
    () => {
      const r = room.value();
      const u = user();
      lastSubscriptions.forEach((s) => s.unsubscribe());
      lastSubscriptions.length = 0;
      scheduledDeletions.set([]);
      highlightedComments.set(new Set());
      scheduledDeletionsModerated.set([]);
      highlightedCommentsModerated.set(new Set());
      if (!r || !u) {
        return;
      }
      const sub1 = injector
        .get(RoomStateService)
        .role$.pipe(
          filter(Boolean),
          switchMap((role) => {
            const userRole =
              role === 'Creator'
                ? UserRole.CREATOR
                : role === 'Moderator'
                  ? UserRole.EXECUTIVE_MODERATOR
                  : UserRole.PARTICIPANT;
            return injector
              .get(WsCommentService)
              .getCommentStream(r.id, userRole);
          }),
        )
        .subscribe((m) => handleMessage(m, 'normal'));
      const sub2 = injector
        .get(RoomStateService)
        .role$.pipe(
          filter(Boolean),
          filter((role) => role === 'Moderator' || role === 'Creator'),
          switchMap(() => {
            return injector
              .get(WsCommentService)
              .getModeratorCommentStream(r.id);
          }),
        )
        .subscribe((m) => handleMessage(m, 'moderated'));
      lastSubscriptions.push(sub1, sub2);
    },
    { injector },
  );
});

// Register for deletion

export const registerUIForComment = (
  commentId: Comment['id'],
  type: 'normal' | 'moderated' | null,
): UICallbackObject => {
  const callback: InternalUICallbackObject = {
    allowed: false,
    allowDelete() {
      this.allowed = true;
      checkRemove(commentId);
    },
    commentId,
    type,
  };
  const manageObj = registeredUICallbacks[commentId] || {
    callbacks: [],
    target: null,
  };
  registeredUICallbacks[commentId] = manageObj;
  manageObj.callbacks.push(callback);
  return callback;
};

export const unregisterUIForComment = (obj: UICallbackObject) => {
  const a = obj as InternalUICallbackObject;
  const manager = registeredUICallbacks[a.commentId];
  if (!manager) {
    return;
  }
  const idx = manager.callbacks.indexOf(a);
  if (idx >= 0) {
    manager.callbacks.splice(idx, 1);
  }
};
