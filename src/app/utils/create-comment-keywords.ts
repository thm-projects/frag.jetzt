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
          text: this.escapeForSpacy(text),
          result
        };
      })
    );
  }

  private static escapeForSpacy(text: string) {
    const upperText = text.toUpperCase();
    const regex = /\s+|$/gmi;
    let m: RegExpExecArray;
    let result = '';
    let lastAddedIndex = 0;
    while ((m = regex.exec(upperText)) !== null) {
      const str = text.substring(lastAddedIndex, m.index);
      if (m.index - lastAddedIndex >= 2 && str === upperText.substring(lastAddedIndex, m.index)) {
        result += str.toLowerCase();
      } else {
        result += str;
      }
      result += text.substring(m.index, regex.lastIndex);
      lastAddedIndex = regex.lastIndex;
      if (regex.lastIndex === m.index) {
        regex.lastIndex++;
      }
    }
    return result;
  }
}
