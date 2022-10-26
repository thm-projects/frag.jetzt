import { TagCloudData, TagCloudDataTagEntry } from './tag-cloud-data.service';
import { SpacyKeyword } from '../http/spacy.service';
import { RoomDataService } from './room-data.service';
import {
  KeywordOrFulltext,
  TopicCloudAdminData,
} from '../../components/shared/_dialogs/topic-cloud-administration/TopicCloudAdminData';
import { stopWords, superfluousSpecialCharacters } from '../../utils/stopwords';
import { escapeForRegex } from '../../utils/regex-escape';
import { ForumComment } from '../../utils/data-accessor';

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
  comment: ForumComment;
  source: SpacyKeyword[];
  censored: boolean[];
  fromQuestioner: boolean;
}

export class TagCloudDataBuilder {
  private readonly data: TagCloudData = new Map<string, TagCloudDataTagEntry>();
  private readonly users = new Set<string>();

  constructor(
    private readonly mods: Set<string>,
    private readonly brainstormingActive: boolean,
    private readonly roomDataService: RoomDataService,
    private readonly adminData: TopicCloudAdminData,
    private readonly blacklist: string[],
    private readonly blacklistEnabled: boolean,
    private readonly roomOwner: string,
  ) {}

  getData() {
    if (!this.brainstormingActive) {
      return new Map<string, TagCloudDataTagEntry>(
        [...this.data].filter((entry) => this.isTopicAllowed(entry[1])),
      );
    }
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
      if (this.brainstormingActive !== comment.brainstormingQuestion) {
        continue;
      }
      const wantedLabels =
        this.adminData.wantedLabels[comment.language.toLowerCase()];
      this.approveKeywords(this.receiveSource(comment), wantedLabels);
      this.users.add(comment.creatorId);
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

  private receiveSource(
    comment: ForumComment,
  ): CommentKeywordSourceInformation {
    const censoredInfo = this.roomDataService.getCensoredInformation(comment);
    if (!censoredInfo) {
      return null;
    }
    let source = comment.keywordsFromQuestioner;
    let censored = censoredInfo.keywordsFromQuestionerCensored;
    let fromQuestioner = true;
    if (this.adminData.keywordORfulltext === KeywordOrFulltext.Both) {
      if (!source || !source.length) {
        fromQuestioner = false;
        source = comment.keywordsFromSpacy;
        censored = censoredInfo.keywordsFromSpacyCensored;
      }
    } else if (
      this.adminData.keywordORfulltext === KeywordOrFulltext.Fulltext
    ) {
      fromQuestioner = false;
      source = comment.keywordsFromSpacy;
      censored = censoredInfo.keywordsFromSpacyCensored;
    }
    if (!source) {
      return null;
    }
    return { source, censored, fromQuestioner, comment };
  }

  private approveKeywords(
    information: CommentKeywordSourceInformation,
    wantedLabels: string[],
  ) {
    if (!information) {
      return;
    }
    const hasLabels = !this.brainstormingActive && wantedLabels?.length;
    information.source.forEach((keyword, index) => {
      if (maskKeyword(keyword.text).length < 3 || information.censored[index]) {
        return;
      }
      if (hasLabels && !keyword.dep?.some((e) => wantedLabels.includes(e))) {
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
    comment: ForumComment,
    isFromQuestioner: boolean,
  ) {
    let current: TagCloudDataTagEntry = this.data.get(keyword.text);
    const commentDate = new Date(comment.createdAt);
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
        questionChildren: new Map<string, ForumComment[]>(),
        countedComments: new Set<string>(),
      };
      this.data.set(keyword.text, current);
    }
    keyword.dep.forEach((dependency) => current.dependencies.add(dependency));
    current.cachedVoteCount += comment.score;
    current.cachedUpVotes += comment.upvotes;
    current.cachedDownVotes += comment.downvotes;
    current.distinctUsers.add(comment.creatorId);
    current.generatedByQuestionerCount += +isFromQuestioner;
    current.taggedCommentsCount += +!!comment.tag;
    this.addResponseAndAnswerCount(current, comment);
    if (comment.creatorId === this.roomOwner) {
      ++current.commentsByCreator;
    } else if (this.mods.has(comment.creatorId)) {
      ++current.commentsByModerators;
    }
    if (comment.tag) {
      current.categories.add(comment.tag);
    }
    if (current.firstTimeStamp.getTime() - commentDate.getTime() > 0) {
      current.firstTimeStamp = commentDate;
    }
    if (current.lastTimeStamp.getTime() - commentDate.getTime() < 0) {
      current.lastTimeStamp = commentDate;
    }
    current.comments.push(comment);
  }

  private addResponseAndAnswerCount(
    data: TagCloudDataTagEntry,
    comment: ForumComment,
  ) {
    data.countedComments.add(comment.id);
    let lastCommentId;
    for (
      let parentComment = comment.parent;
      parentComment;
      parentComment = parentComment.parent
    ) {
      if (data.countedComments.has(parentComment.id)) {
        // when parent counted, this comment already counted.
        return;
      }
      lastCommentId = parentComment.id;
    }
    this.removeChildrenCounts(data, comment, lastCommentId);
    data.responseCount += comment.totalAnswerCounts.accumulated;
    data.answerCount +=
      comment.totalAnswerCounts.fromCreator +
      comment.totalAnswerCounts.fromModerators;
  }

  private removeChildrenCounts(
    data: TagCloudDataTagEntry,
    comment: ForumComment,
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
        if (parentComment.id === comment.id) {
          data.responseCount += comment.totalAnswerCounts.accumulated;
          data.answerCount +=
            comment.totalAnswerCounts.fromCreator +
            comment.totalAnswerCounts.fromModerators;
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
