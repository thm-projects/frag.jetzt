import { ProfanityFilter, Room } from '../../models/room';
import { Comment } from '../../models/comment';
import { SpacyKeyword } from '../http/spacy.service';
import { ProfanityFilterService } from './profanity-filter.service';

export interface CommentFilterData {
  body: string;
  bodyCensored?: boolean;
  keywordsFromQuestioner: SpacyKeyword[];
  keywordsFromQuestionerCensored?: boolean[];
  keywordsFromSpacy: SpacyKeyword[];
  keywordsFromSpacyCensored?: boolean[];
  questionerName: string;
  questionerNameCensored?: boolean;
  answerQuestionerKeywords: SpacyKeyword[];
  answerQuestionerKeywordsCensored?: boolean[];
  answerFulltextKeywords: SpacyKeyword[];
  answerFulltextKeywordsCensored?: boolean[];
}

export class RoomDataProfanityFilter {

  constructor(
    private profanityFilterService: ProfanityFilterService
  ) {
  }

  private static cloneKeywords(arr: SpacyKeyword[]) {
    const newArr = [...arr];
    for (let i = 0; i < newArr.length; i++) {
      newArr[i] = { text: newArr[i].text, dep: [...newArr[i].dep] };
    }
    return newArr;
  }

  public hasDataProfanityMarked(data: CommentFilterData) {
    return data.bodyCensored ||
      data.questionerNameCensored ||
      data.keywordsFromQuestionerCensored.some(e => e) ||
      data.keywordsFromSpacyCensored.some(e => e) ||
      data.answerQuestionerKeywordsCensored.some(e => e) ||
      data.answerFulltextKeywordsCensored.some(e => e);
  }

  public applyToComment(comment: Comment, data: CommentFilterData) {
    comment.body = data.body;
    comment.keywordsFromQuestioner = data.keywordsFromQuestioner;
    comment.keywordsFromSpacy = data.keywordsFromSpacy;
    comment.answerQuestionerKeywords = data.answerQuestionerKeywords;
    comment.answerFulltextKeywords = data.answerFulltextKeywords;
  }

  public filterCommentBody(room: Room, comment: Comment):
    [before: CommentFilterData, after: CommentFilterData, hasProfanity: boolean] {
    const keywordsFromSpacy = RoomDataProfanityFilter.cloneKeywords(comment.keywordsFromSpacy);
    const keywordsFromQuestioner = RoomDataProfanityFilter.cloneKeywords(comment.keywordsFromQuestioner);
    if (!comment.answerFulltextKeywords) {
      comment.answerFulltextKeywords = [];
    }
    const answerFulltextKeywords = RoomDataProfanityFilter.cloneKeywords(comment.answerFulltextKeywords);
    if (!comment.answerQuestionerKeywords) {
      comment.answerQuestionerKeywords = [];
    }
    const answerQuestionerKeywords = RoomDataProfanityFilter.cloneKeywords(comment.answerQuestionerKeywords);
    const after = this.filterCommentOfProfanity(room, comment);
    return [
      {
        body: comment.body,
        keywordsFromSpacy,
        keywordsFromQuestioner,
        questionerName: comment.questionerName,
        answerFulltextKeywords,
        answerQuestionerKeywords
      },
      after,
      this.hasDataProfanityMarked(after)
    ];
  }

  private filterCommentOfProfanity(room: Room, comment: Comment): CommentFilterData {
    const partialWords = room.profanityFilter === ProfanityFilter.all || room.profanityFilter === ProfanityFilter.partialWords;
    const languageSpecific = room.profanityFilter === ProfanityFilter.all || room.profanityFilter === ProfanityFilter.languageSpecific;
    const [body, bodyCensored] = this.profanityFilterService
      .filterProfanityWords(comment.body, partialWords, languageSpecific, comment.language);
    const [keywordsFromSpacy, keywordsFromSpacyCensored] = this
      .checkKeywords(comment.keywordsFromSpacy, partialWords, languageSpecific, comment.language);
    const [keywordsFromQuestioner, keywordsFromQuestionerCensored] = this
      .checkKeywords(comment.keywordsFromQuestioner, partialWords, languageSpecific, comment.language);
    const [questionerName, questionerNameCensored] = this.profanityFilterService
      .filterProfanityWords(comment.questionerName, partialWords, languageSpecific, comment.language);
    const [answerQuestionerKeywords, answerQuestionerKeywordsCensored] = this
      .checkKeywords(comment.answerQuestionerKeywords, partialWords, languageSpecific, comment.language);
    const [answerFulltextKeywords, answerFulltextKeywordsCensored] = this
      .checkKeywords(comment.answerFulltextKeywords, partialWords, languageSpecific, comment.language);
    return {
      body,
      bodyCensored,
      keywordsFromSpacy,
      keywordsFromSpacyCensored,
      keywordsFromQuestioner,
      keywordsFromQuestionerCensored,
      questionerName,
      questionerNameCensored,
      answerQuestionerKeywords,
      answerQuestionerKeywordsCensored,
      answerFulltextKeywords,
      answerFulltextKeywordsCensored
    };
  }

  private checkKeywords(keywords: SpacyKeyword[],
                        partialWords: boolean,
                        languageSpecific: boolean,
                        lang: string): [SpacyKeyword[], boolean[]] {
    const newKeywords = [...keywords];
    const censored: boolean[] = new Array(keywords.length);
    for (let i = 0; i < newKeywords.length; i++) {
      const [text, textCensored] = this.profanityFilterService
        .filterProfanityWords(newKeywords[i].text, partialWords, languageSpecific, lang);
      censored[i] = textCensored;
      newKeywords[i] = {
        text,
        dep: newKeywords[i].dep
      };
    }
    return [newKeywords, censored];
  }
}
