import { Comment } from 'app/models/comment';
import { AnswerCount, UIComment } from '../state/comment-updates';
import { moderatorsSet, room } from '../state/room';

// build data

const propagate = (comment: UIComment, c: AnswerCount) => {
  comment.totalAnswerCount.participants += c.participants;
  comment.totalAnswerCount.moderators += c.moderators;
  comment.totalAnswerCount.creator += c.creator;
  if (comment.parent) {
    propagate(comment.parent, c);
  }
};

const addToParent = (
  comment: UIComment,
  child: UIComment,
  ownerId: string,
  mods: Set<string>,
) => {
  child.parent = comment;
  comment.children.add(child);
  const creatorId = child.comment.creatorId;
  const newAnswerCount = { ...child.totalAnswerCount };
  if (creatorId === ownerId) {
    comment.answerCount.creator += 1;
    newAnswerCount.creator += 1;
  } else if (mods.has(creatorId)) {
    comment.answerCount.moderators += 1;
    newAnswerCount.moderators += 1;
  } else {
    comment.answerCount.participants += 1;
    newAnswerCount.participants += 1;
  }
  newAnswerCount.participants += child.totalAnswerCount.participants;
  newAnswerCount.moderators += child.totalAnswerCount.moderators;
  newAnswerCount.creator += child.totalAnswerCount.creator;
  propagate(comment, newAnswerCount);
};

interface CommentIndex {
  [key: Comment['id']]: UIComment;
}
export interface IndexedComments {
  rawComments: UIComment[];
  forumComments: UIComment[];
  fastAccess: CommentIndex;
}

export const makeMeta = (comments: UIComment[]): IndexedComments => {
  const waitParents: { [key: Comment['id']]: UIComment[] } = {};
  const fastAccess: CommentIndex = {};
  const r = room.value()?.ownerId;
  const mods = moderatorsSet();
  const forumComments = [];
  for (const c of comments) {
    fastAccess[c.comment.id] = c;
    // check for parent
    const ref = c.comment.commentReference;
    if (ref) {
      const parent = fastAccess[ref];
      if (!parent) {
        const arr = waitParents[ref] || [];
        waitParents[ref] = arr;
        arr.push(c);
      } else {
        addToParent(parent, c, r, mods);
      }
    } else {
      forumComments.push(c);
    }
    // check for children
    const arr = waitParents[c.comment.id];
    if (!arr) continue;
    for (const e of arr) {
      addToParent(c, e, r, mods);
    }
    arr.length = 0;
    delete waitParents[c.comment.id];
  }
  return {
    rawComments: comments,
    forumComments,
    fastAccess,
  };
};

// filter data
