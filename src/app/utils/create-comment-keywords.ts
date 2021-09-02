import { Language, LanguagetoolService } from '../services/http/languagetool.service';
import { map } from 'rxjs/operators';

export class CreateCommentKeywords {

  static isKeywordAcceptable(keyword: string) {
    const regex = /(^[ -@\[-`{-~]+$)/g;
    return keyword.match(regex) === null && keyword.length > 2;
  }

  static isSpellingAcceptable(languagetoolService: LanguagetoolService, text: string, language: Language = 'auto') {
    return languagetoolService.checkSpellings(text, language).pipe(
      map(result => {
        const wordCount = text.trim().split(' ').length;
        const hasConfidence = language === 'auto' ? result.language.detectedLanguage.confidence >= 0.5 : true;
        const hasLessMistakes = (result.matches.length * 100) / wordCount <= 20;
        return {
          isAcceptable: hasConfidence && hasLessMistakes,
          text,
          result
        };
      })
    );
  }
}
