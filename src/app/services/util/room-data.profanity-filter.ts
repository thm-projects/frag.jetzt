import { ProfanityFilter, Room } from '../../models/room';
import { Comment } from '../../models/comment';
import { SpacyKeyword } from '../http/spacy.service';
import { ProfanityFilterService } from './profanity-filter.service';
import { ForumComment } from '../../utils/data-accessor';

export interface CommentFilterData {
  body: string;
  bodyCensored?: boolean;
  keywordsFromQuestioner: SpacyKeyword[];
  keywordsFromQuestionerCensored?: boolean[];
  keywordsFromSpacy: SpacyKeyword[];
  keywordsFromSpacyCensored?: boolean[];
  questionerName: string;
  questionerNameCensored?: boolean;
}

export interface CommentProfanityInformation {
  comment: ForumComment;
  beforeFiltering: CommentFilterData;
  afterFiltering: CommentFilterData;
  hasProfanity: boolean;
  filtered: boolean;
}

export class RoomDataProfanityFilter {
  constructor(
    private profanityFilterService: ProfanityFilterService,
    private room: Room,
  ) {}

  public static hasDataProfanityMarked(data: CommentFilterData) {
    return (
      data.bodyCensored ||
      data.questionerNameCensored ||
      data.keywordsFromQuestionerCensored.some((e) => e) ||
      data.keywordsFromSpacyCensored.some((e) => e)
    );
  }

  public static applyToComment(comment: ForumComment, data: CommentFilterData) {
    comment.body = data.body;
    comment.keywordsFromQuestioner = data.keywordsFromQuestioner;
    comment.keywordsFromSpacy = data.keywordsFromSpacy;
  }

  private static cloneKeywords(arr: SpacyKeyword[]) {
    const newArr = [...arr];
    for (let i = 0; i < newArr.length; i++) {
      newArr[i] = { text: newArr[i].text, dep: [...newArr[i].dep] };
    }
    return newArr;
  }

  public filterComment(
    comment: ForumComment,
    censorIfProfanity = true,
  ): CommentProfanityInformation {
    const before: CommentFilterData = {
      body: comment.body,
      keywordsFromSpacy: RoomDataProfanityFilter.cloneKeywords(
        comment.keywordsFromSpacy,
      ),
      keywordsFromQuestioner: RoomDataProfanityFilter.cloneKeywords(
        comment.keywordsFromQuestioner,
      ),
      questionerName: comment.questionerName,
    };
    const after = this.filterCommentOfProfanity(this.room, comment);
    const hasProfanity = RoomDataProfanityFilter.hasDataProfanityMarked(after);
    const filtered = censorIfProfanity && hasProfanity;
    if (filtered) {
      RoomDataProfanityFilter.applyToComment(comment, after);
    }
    return {
      comment,
      beforeFiltering: before,
      afterFiltering: after,
      hasProfanity,
      filtered,
    };
  }

  private filterCommentOfProfanity(
    room: Room,
    comment: Comment,
  ): CommentFilterData {
    const partialWords =
      room.profanityFilter === ProfanityFilter.ALL ||
      room.profanityFilter === ProfanityFilter.PARTIAL_WORDS;
    const languageSpecific =
      room.profanityFilter === ProfanityFilter.ALL ||
      room.profanityFilter === ProfanityFilter.LANGUAGE_SPECIFIC;
    const [body, bodyCensored] = this.checkQuill(
      comment.body,
      partialWords,
      languageSpecific,
      comment.language,
    );
    const [keywordsFromSpacy, keywordsFromSpacyCensored] = this.checkKeywords(
      comment.keywordsFromSpacy,
      partialWords,
      languageSpecific,
      comment.language,
    );
    const [keywordsFromQuestioner, keywordsFromQuestionerCensored] =
      this.checkKeywords(
        comment.keywordsFromQuestioner,
        partialWords,
        languageSpecific,
        comment.language,
      );
    const [questionerName, questionerNameCensored] =
      this.profanityFilterService.filterProfanityWords(
        comment.questionerName,
        partialWords,
        languageSpecific,
        comment.language,
      );
    return {
      body,
      bodyCensored,
      keywordsFromSpacy,
      keywordsFromSpacyCensored,
      keywordsFromQuestioner,
      keywordsFromQuestionerCensored,
      questionerName,
      questionerNameCensored,
    };
  }

  private checkQuill(
    quillDelta: string,
    partialWords: boolean,
    languageSpecific: boolean,
    lang: string,
  ): [string, boolean] {
    const [text, textCensored] =
      this.profanityFilterService.filterProfanityWords(
        quillDelta,
        partialWords,
        languageSpecific,
        lang,
      );
    return [text, textCensored];
  }

  private checkKeywords(
    keywords: SpacyKeyword[],
    partialWords: boolean,
    languageSpecific: boolean,
    lang: string,
  ): [SpacyKeyword[], boolean[]] {
    const newKeywords = [...keywords];
    const censored: boolean[] = new Array(keywords.length);
    for (let i = 0; i < newKeywords.length; i++) {
      const [text, textCensored] =
        this.profanityFilterService.filterProfanityWords(
          newKeywords[i].text,
          partialWords,
          languageSpecific,
          lang,
        );
      censored[i] = textCensored;
      newKeywords[i] = {
        text,
        dep: newKeywords[i].dep,
      };
    }
    return [newKeywords, censored];
  }
}
