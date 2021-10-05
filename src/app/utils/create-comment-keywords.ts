import { Language, LanguagetoolService } from '../services/http/languagetool.service';
import { map } from 'rxjs/operators';

export class CreateCommentKeywords {

  static isKeywordAcceptable(keyword: string): boolean {
    const regex = /(^[ -@\[-`{-~]+$)/g;
    return keyword.match(regex) === null && keyword.length > 2;
  }

  static removeMarkdown(text: string): string {
    return text.replace(/([*_~]+(?=[^*_~\s]))|(^[ \t]*#+ )|(^[ \t]*>[> ]*)|(`+)/gm, '')
      .replace(/([^*_~\s])[*_~]+/gm, '$1')
      .replace(/\[([^\n\[\]]*)\]\(([^()\n]*)\)/gm, '$1 $2');
  }

  static isSpellingAcceptable(languagetoolService: LanguagetoolService, text: string, language: Language = 'auto') {
    return languagetoolService.checkSpellings(text, language).pipe(
      map(result => {
        const wordCount = text.trim().split(' ').length;
        const hasConfidence = language === 'auto' ? result.language.detectedLanguage.confidence >= 0.5 : true;
        const hasLessMistakes = (result.matches.length * 100) / wordCount <= 50;
        return {
          isAcceptable: hasConfidence && hasLessMistakes,
          text: this.escapeForSpacy(text),
          result
        };
      })
    );
  }

  static escapeForSpacy(text: string): string {
    text = this.makeCapslockLowercase(text);
    return text.replace(/\(([^-\s)]+-)\)([^\s]+)/gmi, '$1$2');
  }

  private static makeCapslockLowercase(text: string): string {
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
