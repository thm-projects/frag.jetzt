import { BrainstormingSession } from 'app/models/brainstorming-session';
import { ForumComment } from 'app/utils/data-accessor';
import { QuillUtils } from 'app/utils/quill-utils';
import { SharedTextFormatting } from 'app/utils/shared-text-formatting';

export class BrainstormingTopic {
  constructor(
    public weight = 0,
    public adjustedWeight = 0,
    public cachedVoteCount = 0,
    public cachedUpVotes = 0,
    public cachedDownVotes = 0,
    public distinctUsers = new Set<string>(),
    public categories = new Set<string>(),
    public comments = [],
    public commentsByCreator = 0,
    public commentsByModerators = 0,
    public firstTopicName = null,
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

  addComments(comments: ForumComment[]): void {
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
      const topic =
        this.data.get(word.id) ||
        this.data.set(word.id, new BrainstormingTopic()).get(word.id);
      topic.cachedVoteCount += word.upvotes - word.downvotes;
      topic.cachedUpVotes += word.upvotes;
      topic.cachedDownVotes += word.downvotes;
      topic.distinctUsers.add(comment.creatorId);
      if (word.categoryId) {
        topic.categories.add(word.categoryId);
      }
      topic.comments.push(comment);
      topic.commentsByCreator += Number(comment.creatorId === this.roomOwner);
      topic.commentsByModerators += Number(this.mods.has(comment.creatorId));
      if (topic.firstTopicName === null) {
        topic.firstTopicName = SharedTextFormatting.getTerm(
          QuillUtils.getTextFromDelta(comment.body),
        );
      }
      this.users.add(comment.creatorId);
    }
  }
}
