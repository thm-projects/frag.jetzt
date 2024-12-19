import { TagCloudData, TagCloudDataTagEntry } from './tag-cloud-data.service';
import { SpacyKeyword } from '../http/spacy.service';
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
  source: SpacyKeyword[];
  censored: boolean[];
  fromQuestioner: boolean;
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
      const wantedLabels =
        this.adminData.wantedLabels[comment.comment.language.toLowerCase()];
      this.approveKeywords(this.receiveSource(comment), wantedLabels);
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
    let keywords = comment.comment.keywordsFromQuestioner;
    let fromQuestioner = true;
    if (!keywords?.length) {
      keywords = comment.comment.keywordsFromSpacy || [];
      fromQuestioner = false;
    }
    return {
      comment: comment,
      source: keywords,
      censored: new Array(keywords.length).fill(false),
      fromQuestioner,
    };
  }

  private approveKeywords(
    information: CommentKeywordSourceInformation,
    wantedLabels: string[],
  ) {
    if (!information) {
      return;
    }
    information.source.forEach((keyword, index) => {
      if (maskKeyword(keyword.text).length < 3 || information.censored[index]) {
        return;
      }
      if (
        wantedLabels?.length &&
        !keyword.dep?.some((e) => wantedLabels.includes(e))
      ) {
        return;
      }
      if (!this.passesBlacklist(keyword.text)) {
        return;
      }
      this.addToData(keyword, information.comment, information.fromQuestioner);
    });
  }

  private addToData(
    keyword: SpacyKeyword,
    comment: UIComment,
    isFromQuestioner: boolean,
  ) {
    let current: TagCloudDataTagEntry = this.data.get(keyword.text);
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
        dependencies: new Set<string>([...keyword.dep]),
        firstTimeStamp: commentDate,
        lastTimeStamp: commentDate,
        generatedByQuestionerCount: 0,
        taggedCommentsCount: 0,
        commentsByCreator: 0,
        commentsByModerators: 0,
        responseCount: 0,
        answerCount: 0,
        questionChildren: new Map<string, UIComment[]>(),
        countedComments: new Set<string>(),
      };
      this.data.set(keyword.text, current);
    }
    keyword.dep.forEach((dependency) => current.dependencies.add(dependency));
    current.cachedVoteCount += comment.comment.score;
    current.cachedUpVotes += comment.comment.upvotes;
    current.cachedDownVotes += comment.comment.downvotes;
    current.distinctUsers.add(comment.comment.creatorId);
    current.generatedByQuestionerCount += +isFromQuestioner;
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
