import { Language, LanguagetoolResult, LanguagetoolService } from '../services/http/languagetool.service';
import { CreateCommentKeywords } from './create-comment-keywords';

export class GrammarChecker {

  languages: Language[] = ['de-DE', 'en-US', 'fr', 'auto'];
  selectedLang: Language = 'auto';
  isSpellchecking = false;
  hasSpellcheckConfidence = true;
  newLang = 'auto';

  private commentBody: () => HTMLDivElement;
  private langSelect: () => HTMLSpanElement;

  constructor(private languagetoolService: LanguagetoolService) {
  }

  initBehavior(commentBody: () => HTMLDivElement, langSelect: () => HTMLSpanElement) {
    this.commentBody = commentBody;
    this.langSelect = langSelect;
  }

  onDocumentClick(e) {
    const container = document.getElementsByClassName('dropdownBlock');
    Array.prototype.forEach.call(container, (elem) => {
      const hasMarkup = (e.target as Node).parentElement ? (e.target as Node).parentElement.classList.contains('markUp') : false;
      if (!elem.contains(e.target) && (!hasMarkup ||
        (e.target as HTMLElement).dataset.id !== (elem as Node).parentElement.dataset.id)) {
        (elem as HTMLElement).style.display = 'none';
      }
    });
  }

  maxLength(commentBody: HTMLDivElement, size: number): void {
    if (commentBody.innerText.length > size) {
      commentBody.innerText = commentBody.innerText.slice(0, size);
    }
    const body = commentBody.innerText;
    if (body.length === 1 && body.charCodeAt(body.length - 1) === 10) {
      commentBody.innerHTML = commentBody.innerHTML.replace('<br>', '');
    }
  }

  onPaste(e) {
    e.preventDefault();
    const text = e.clipboardData.getData('text');
    const selection = window.getSelection();
    const min = Math.min(selection.anchorOffset, selection.focusOffset);
    const max = Math.max(selection.anchorOffset, selection.focusOffset);
    const content = selection.anchorNode.textContent;
    selection.anchorNode.textContent = content.substring(0, min) + text + content.substr(max);
    const range = document.createRange();
    const elem = selection.anchorNode instanceof HTMLElement ? selection.anchorNode.lastChild : selection.anchorNode;
    range.setStart(elem, min + text.length);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  grammarCheck(commentBody: HTMLDivElement): void {
    this.onDocumentClick({
      target: document
    });
    const wrongWords: string[] = [];
    this.isSpellchecking = true;
    this.hasSpellcheckConfidence = true;
    const unfilteredText = commentBody.innerText;
    const text = CreateCommentKeywords.cleaningFunction(commentBody.innerText, true);
    this.checkSpellings(text).subscribe((wordsCheck) => {
      if (!this.checkLanguageConfidence(wordsCheck)) {
        this.hasSpellcheckConfidence = false;
        return;
      }
      if (this.selectedLang === 'auto' && (this.langSelect().innerText.includes(this.newLang)
        || this.langSelect().innerText.includes('auto'))) {
        if (wordsCheck.language.name.includes('German')) {
          this.selectedLang = 'de-DE';
        } else if (wordsCheck.language.name.includes('English')) {
          this.selectedLang = 'en-US';
        } else if (wordsCheck.language.name.includes('French')) {
          this.selectedLang = 'fr';
        } else {
          this.newLang = wordsCheck.language.name;
        }
        this.langSelect().innerHTML = this.newLang;
      }
      if (wordsCheck.matches.length <= 0) {
        return;
      }
      wordsCheck.matches.forEach(grammarError => {
        const wrongWord = text.slice(grammarError.offset, grammarError.offset + grammarError.length);
        wrongWords.push(wrongWord);
      });

      let lastFound = unfilteredText.length;
      this.checkSpellings(unfilteredText).subscribe((res) => {
        commentBody.innerHTML = '';
        for (let i = res.matches.length - 1; i >= 0; i--) {
          const end = res.matches[i].offset + res.matches[i].length;
          const start = res.matches[i].offset;
          const wrongWord = unfilteredText.slice(start, end);

          if (!wrongWords.includes(wrongWord)) {
            continue;
          }

          if (lastFound > end) {
            commentBody.prepend(unfilteredText.slice(end, lastFound));
          }
          commentBody.prepend(this.createSuggestionHTML(res, i, wrongWord));
          lastFound = res.matches[i].offset;
        }
        if (lastFound > 0) {
          commentBody.prepend(unfilteredText.slice(0, lastFound));
        }
      });
    }, () => {
      this.isSpellchecking = false;
    }, () => {
      this.isSpellchecking = false;
    });
  }

  checkLanguageConfidence(wordsCheck: any) {
    return this.selectedLang === 'auto' ? wordsCheck.language.detectedLanguage.confidence >= 0.5 : true;
  }

  checkSpellings(text: string, language: Language = this.selectedLang) {
    return this.languagetoolService.checkSpellings(text, language);
  }

  private createSuggestionHTML(result: LanguagetoolResult, index: number, wrongWord: string) {
    const markUpDiv = document.createElement('div');
    markUpDiv.classList.add('markUp');
    markUpDiv.dataset.id = String(index);
    const wordMarker = document.createElement('span');
    wordMarker.dataset.id = String(index);
    wordMarker.append(wrongWord);
    markUpDiv.append(wordMarker);
    const dropDownDiv = document.createElement('div');
    dropDownDiv.classList.add('dropdownBlock');
    markUpDiv.append(dropDownDiv);
    markUpDiv.addEventListener('click', () => {
      dropDownDiv.style.display = 'block';
      const rectdiv = this.commentBody().getBoundingClientRect();
      const rectmarkup = markUpDiv.getBoundingClientRect();
      let offset;
      if (rectmarkup.x + rectmarkup.width / 2 > rectdiv.right - 80) {
        offset = rectdiv.right - rectmarkup.x - rectmarkup.width;
        dropDownDiv.style.right = -offset + 'px';
      } else if (rectmarkup.x + rectmarkup.width / 2 < rectdiv.left + 80) {
        offset = rectmarkup.x - rectdiv.left;
        dropDownDiv.style.left = -offset + 'px';
      } else {
        dropDownDiv.style.left = '50%';
        dropDownDiv.style.marginLeft = '-80px';
      }
    });
    const suggestions = result.matches[index].replacements;
    if (!suggestions.length) {
      const elem = document.createElement('span');
      elem.classList.add('error-message');
      elem.append(result.matches[index].message);
      dropDownDiv.append(elem);
    } else {
      const length = suggestions.length > 3 ? 3 : suggestions.length;
      for (let j = 0; j < length; j++) {
        const elem = document.createElement('span');
        elem.classList.add('suggestions');
        elem.append(suggestions[j].value);
        elem.addEventListener('click', () => {
          elem.parentElement.parentElement.outerHTML = suggestions[j].value;
        });
        dropDownDiv.append(elem);
      }
    }
    return markUpDiv;
  }
}
