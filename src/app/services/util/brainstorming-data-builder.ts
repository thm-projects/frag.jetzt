import { BrainstormingSession } from 'app/models/brainstorming-session';
import { UIComment } from 'app/room/state/comment-updates';

export class BrainstormingTopic {
  constructor(
    public preview: string,
    public weight = 0,
    public adjustedWeight = 0,
    public cachedVoteCount = 0,
    public cachedUpVotes = 0,
    public cachedDownVotes = 0,
    public distinctUsers = new Set<string>(),
    public categories = new Set<string>(),
    public words = new Set<string>(),
    public countedComments = new Set<string>(),
    public commentsByCreator = 0,
    public commentsByModerators = 0,
    public responseCount = 0,
    public answerCount = 0,
    public questionChildren = new Map<string, UIComment[]>(),
  ) {}
}

export class BrainstormingDataBuilder {
  private readonly data: Map<string, BrainstormingTopic> = new Map<
    string,
    BrainstormingTopic
  >();
  private readonly users = new Set<string>();

  constructor(
    private readonly mods: Set<string>,
    private readonly roomOwner: string,
    private readonly session: BrainstormingSession,
    private readonly ideaFilter: string | null,
  ) {}

  getData() {
    return this.data;
  }

  getUsers() {
    return this.users;
  }

  clear() {
    this.data.clear();
    this.users.clear();
  }

  addComments(comments: UIComment[], allowBanned = false): void {
    for (const comment of comments) {
      if (comment.comment.brainstormingSessionId === null) {
        continue;
      }
      const word =
        this.session.wordsWithMeta[comment.comment.brainstormingWordId]?.word;
      if (!word) {
        console.error('Unknown brainstorming entry:', comment);
        continue;
      }
      if (!this.isAllowed(word.categoryId)) {
        continue;
      }
      if (word.banned && !allowBanned) {
        continue;
      }
      const preview = word.correctedWord || word.word;
      const id = preview.toLowerCase();
      const topic =
        this.data.get(id) ??
        this.data.set(id, new BrainstormingTopic(preview)).get(id);
      if (!topic.words.has(word.id)) {
        topic.words.add(word.id);
        topic.cachedVoteCount += word.upvotes - word.downvotes;
        topic.cachedUpVotes += word.upvotes;
        topic.cachedDownVotes += word.downvotes;
        if (word.categoryId) {
          topic.categories.add(word.categoryId);
        }
      }
      topic.distinctUsers.add(comment.comment.creatorId);
      this.addResponseAndAnswerCount(topic, comment);
      topic.commentsByCreator += Number(
        comment.comment.creatorId === this.roomOwner,
      );
      topic.commentsByModerators += Number(
        this.mods.has(comment.comment.creatorId),
      );
      this.users.add(comment.comment.creatorId);
    }
  }

  private isAllowed(categoryId: string) {
    if (this.ideaFilter === null) {
      return true;
    }
    if (!this.ideaFilter && !categoryId) {
      return true;
    }
    return this.ideaFilter === categoryId;
  }

  private addResponseAndAnswerCount(
    data: BrainstormingTopic,
    comment: UIComment,
  ) {
    data.countedComments.add(comment.comment.id);
    let lastCommentId;
    for (
      let parentComment = comment.parent;
      parentComment;
      parentComment = parentComment.parent
    ) {
      if (data.countedComments.has(parentComment.comment.id)) {
        // when parent counted, this comment already counted.
        return;
      }
      lastCommentId = parentComment.comment.id;
    }
    this.removeChildrenCounts(data, comment, lastCommentId);
    data.responseCount +=
      comment.totalAnswerCount.participants +
      comment.totalAnswerCount.moderators +
      comment.totalAnswerCount.creator;
    data.answerCount +=
      comment.totalAnswerCount.creator + comment.totalAnswerCount.moderators;
  }

  private removeChildrenCounts(
    data: BrainstormingTopic,
    comment: UIComment,
    lastCommentId: string,
  ) {
    const referenced =
      data.questionChildren.get(lastCommentId) ||
      data.questionChildren.set(lastCommentId, []).get(lastCommentId);
    const filtered = referenced.filter((children) => {
      for (
        let parentComment = children.parent;
        parentComment;
        parentComment = parentComment.parent
      ) {
        if (parentComment.comment.id === comment.comment.id) {
          data.responseCount +=
            comment.totalAnswerCount.participants +
            comment.totalAnswerCount.moderators +
            comment.answerCount.creator;
          data.answerCount +=
            comment.totalAnswerCount.creator +
            comment.totalAnswerCount.moderators;
          return false;
        }
      }
      return true;
    });
    filtered.push(comment);
    data.questionChildren.set(lastCommentId, filtered);
  }
}
