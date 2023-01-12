import { BrainstormingSession } from 'app/models/brainstorming-session';
import { ForumComment } from 'app/utils/data-accessor';

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
    public comments = [],
    public commentsByCreator = 0,
    public commentsByModerators = 0,
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

  addComments(comments: ForumComment[], allowBanned = false): void {
    for (const comment of comments) {
      if (comment.brainstormingSessionId === null) {
        continue;
      }
      const word =
        this.session.wordsWithMeta[comment.brainstormingWordId]?.word;
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
      topic.distinctUsers.add(comment.creatorId);
      topic.comments.push(comment);
      topic.commentsByCreator += Number(comment.creatorId === this.roomOwner);
      topic.commentsByModerators += Number(this.mods.has(comment.creatorId));
      this.users.add(comment.creatorId);
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
}
