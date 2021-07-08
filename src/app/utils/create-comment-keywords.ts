import { Language, LanguagetoolService } from '../services/http/languagetool.service';
import { map } from 'rxjs/operators';

export class CreateCommentKeywords {

  static isKeywordAcceptable(keyword: string) {
    const regex = /(^[ -@\[-`{-~]+$)/g;
    return keyword.match(regex) === null && keyword.length > 1;
  }

  static isSpellingAcceptable(languagetoolService: LanguagetoolService, text: string, language: Language = 'auto') {
    text = this.cleaningFunction(text);
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

  static cleaningFunction(text: string): string {
    // eslint-disable-next-line max-len
    const regexEmoji = new RegExp('\uD918\uDD28|\ufe0f|\u200D|\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff]', 'g');
    const regexKatex = new RegExp('\\$[^$\\n ]+\\$|\\$\\$[^$\\n ]+\\$\\$', 'g');
    const regexMarkdown = new RegExp('(?:__|[*#])|\\[(.+?)]\\((.+?)\\)', 'g');
    const regexBlank = new RegExp('[\\s]{2,}', 'gu');
    text = text.replace(regexKatex, '');
    text = text.replace(regexEmoji, '');
    text = text.replace(regexMarkdown, '');
    text = text.replace(regexBlank, ' ');
    return text;
  }
}
