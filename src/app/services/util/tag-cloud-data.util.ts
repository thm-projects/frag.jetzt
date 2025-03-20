import { TagCloudData, TagCloudDataTagEntry } from './tag-cloud-data.service';
import { TopicCloudAdminData } from '../../components/shared/_dialogs/topic-cloud-administration/TopicCloudAdminData';
import { stopWords, superfluousSpecialCharacters } from '../../utils/stopwords';
import { escapeForRegex } from '../../utils/regex-escape';
import { UIComment } from 'app/room/state/comment-updates';

const words = stopWords.map((word) =>
  escapeForRegex(word).replace(/\s+/, '\\s*'),
);
const httpRegex = /(https?:[^\s]+(\s|$))/;
const specialCharacters =
  '[' + escapeForRegex(superfluousSpecialCharacters) + ']+';
const regexMaskKeyword = new RegExp(
  '\\b(' +
    words.join('|') +
    ')\\b|' +
    httpRegex.source +
    '|' +
    specialCharacters,
  'gmi',
);
export const maskKeyword = (keyword: string): string =>
  keyword.replace(regexMaskKeyword, '').replace(/\s+/, ' ').trim();

interface CommentKeywordSourceInformation {
  comment: UIComment;
  source: string[];
  censored: boolean[];
}

export class TagCloudDataBuilder {
  private readonly data: TagCloudData = new Map<string, TagCloudDataTagEntry>();
  private readonly users = new Set<string>();

  constructor(
    private readonly mods: Set<string>,
    private readonly adminData: TopicCloudAdminData,
    private readonly blacklist: string[],
    private readonly blacklistEnabled: boolean,
    private readonly roomOwner: string,
  ) {}

  getData() {
    return new Map<string, TagCloudDataTagEntry>(
      [...this.data].filter((entry) => this.isTopicAllowed(entry[1])),
    );
  }

  getUsers() {
    return this.users;
  }

  clear() {
    this.data.clear();
    this.users.clear();
  }

  addComments(comments: UIComment[]): void {
    for (const comment of comments) {
      if (comment.comment.brainstormingSessionId !== null) {
        continue;
      }
      this.approveKeywords(this.receiveSource(comment));
      this.users.add(comment.comment.creatorId);
    }
  }

  private isTopicAllowed(data: TagCloudDataTagEntry) {
    return !(
      this.adminData.minQuestions > data.comments.length ||
      this.adminData.minQuestioners > data.distinctUsers.size ||
      this.adminData.minUpvotes > data.cachedUpVotes ||
      (this.adminData.startDate &&
        new Date(this.adminData.startDate) > data.firstTimeStamp) ||
      (this.adminData.endDate &&
        new Date(this.adminData.endDate) < data.lastTimeStamp)
    );
  }

  private receiveSource(comment: UIComment): CommentKeywordSourceInformation {
    const keywords = comment.comment.keywords;
    const source: string[] = [];
    if (keywords?.entities) {
      source.push(...keywords.entities);
    }
    if (keywords?.keywords) {
      source.push(...keywords.keywords);
    }
    return {
      comment: comment,
      source,
      censored: new Array(source.length).fill(false),
    };
  }

  private approveKeywords(information: CommentKeywordSourceInformation) {
    if (!information) {
      return;
    }
    information.source.forEach((keyword, index) => {
      if (maskKeyword(keyword).length < 3 || information.censored[index]) {
        return;
      }
      if (!this.passesBlacklist(keyword)) {
        return;
      }
      this.addToData(keyword, information.comment);
    });
  }

  private addToData(keyword: string, comment: UIComment) {
    let current: TagCloudDataTagEntry = this.data.get(keyword);
    const commentDate = new Date(comment.comment.createdAt);
    if (current === undefined) {
      current = {
        cachedVoteCount: 0,
        cachedUpVotes: 0,
        cachedDownVotes: 0,
        comments: [],
        weight: 0,
        adjustedWeight: 0,
        distinctUsers: new Set<string>(),
        categories: new Set<string>(),
        firstTimeStamp: commentDate,
        lastTimeStamp: commentDate,
        taggedCommentsCount: 0,
        commentsByCreator: 0,
        commentsByModerators: 0,
        responseCount: 0,
        answerCount: 0,
        questionChildren: new Map<string, UIComment[]>(),
        countedComments: new Set<string>(),
      };
      this.data.set(keyword, current);
    }
    current.cachedVoteCount += comment.comment.score;
    current.cachedUpVotes += comment.comment.upvotes;
    current.cachedDownVotes += comment.comment.downvotes;
    current.distinctUsers.add(comment.comment.creatorId);
    current.taggedCommentsCount += +!!comment.comment.tag;
    this.addResponseAndAnswerCount(current, comment);
    if (comment.comment.creatorId === this.roomOwner) {
      ++current.commentsByCreator;
    } else if (this.mods.has(comment.comment.creatorId)) {
      ++current.commentsByModerators;
    }
    if (comment.comment.tag) {
      current.categories.add(comment.comment.tag);
    }
    if (current.firstTimeStamp.getTime() - commentDate.getTime() > 0) {
      current.firstTimeStamp = commentDate;
    }
    if (current.lastTimeStamp.getTime() - commentDate.getTime() < 0) {
      current.lastTimeStamp = commentDate;
    }
    current.comments.push(comment.comment);
  }

  private addResponseAndAnswerCount(
    data: TagCloudDataTagEntry,
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
      comment.answerCount.creator;
    data.answerCount +=
      comment.totalAnswerCount.creator + comment.totalAnswerCount.moderators;
  }

  private removeChildrenCounts(
    data: TagCloudDataTagEntry,
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
            comment.totalAnswerCount.creator;
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

  private passesBlacklist(keyword: string) {
    keyword = keyword.toLowerCase();
    return (
      !this.blacklistEnabled ||
      this.blacklist.every((profaneWord) => !keyword.includes(profaneWord))
    );
  }
}
