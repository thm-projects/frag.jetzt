import { Language, LanguagetoolService } from '../services/http/languagetool.service';
import { CreateCommentKeywords } from './create-comment-keywords';

export class GrammarChecker {

  languages: Language[] = ['de-DE', 'en-US', 'fr', 'auto'];
  selectedLang: Language = 'auto';
  isSpellchecking = false;
  hasSpellcheckConfidence = true;
  newLang = 'auto';

  constructor(private languagetoolService: LanguagetoolService) {
  }

  onDocumentClick(e) {
    const container = document.getElementsByClassName('dropdownBlock');
    Array.prototype.forEach.call(container, (elem) => {
      if (!elem.contains(e.target) && (!(e.target as Node).parentElement.classList.contains('markUp')
        || (e.target as HTMLElement).dataset.id !== ((elem as Node).parentElement as HTMLElement).dataset.id)) {
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
    const elem = document.getElementById('answer-input');
    const text = e.clipboardData.getData('text');
    elem.innerText += text.replace(/<[^>]*>?/gm, '');

    const range = document.createRange();
    range.setStart(elem.lastChild, elem.lastChild.textContent.length);
    range.collapse(true);

    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  grammarCheck(commentBody: HTMLDivElement): void {
    const wrongWords: string[] = [];
    this.isSpellchecking = true;
    this.hasSpellcheckConfidence = true;
    const text = CreateCommentKeywords.cleaningFunction(commentBody.innerText);
    this.checkSpellings(text).subscribe((wordsCheck) => {
      if (!this.checkLanguageConfidence(wordsCheck)) {
        this.hasSpellcheckConfidence = false;
        return;
      }
      if (this.selectedLang === 'auto' && (document.getElementById('langSelect').innerText.includes(this.newLang)
        || document.getElementById('langSelect').innerText.includes('auto'))) {
        if (wordsCheck.language.name.includes('German')) {
          this.selectedLang = 'de-DE';
        } else if (wordsCheck.language.name.includes('English')) {
          this.selectedLang = 'en-US';
        } else if (wordsCheck.language.name.includes('French')) {
          this.selectedLang = 'fr';
        } else {
          this.newLang = wordsCheck.language.name;
        }
        document.getElementById('langSelect').innerHTML = this.newLang;
      }
      if (wordsCheck.matches.length > 0) {
        wordsCheck.matches.forEach(grammarError => {
          const wrongWord = commentBody.innerText.slice(grammarError.offset, grammarError.offset + grammarError.length);
          wrongWords.push(wrongWord);
        });

        let html = '';
        let lastFound = text.length;
        this.checkSpellings(text).subscribe((res) => {
          for (let i = res.matches.length - 1; i >= 0; i--) {
            const end = res.matches[i].offset + res.matches[i].length;
            const start = res.matches[i].offset;
            const wrongWord = text.slice(start, end);

            if (wrongWords.includes(wrongWord)) {
              const suggestions: any[] = res.matches[i].replacements;
              let displayOptions = 3;
              let suggestionsHTML = '';

              if (!suggestions.length) {
                suggestionsHTML = '<span style="color: black; display: block; text-align: center;">' + res.matches[i].message + '</span>';
              }

              if (suggestions.length < displayOptions) {
                displayOptions = suggestions.length;
              }

              for (let j = 0; j < displayOptions; j++) {
                // eslint-disable-next-line max-len
                suggestionsHTML += '<span class="suggestions"' + ' style="color: black; display: block; text-align: center; cursor: pointer;">' + suggestions[j].value + '</span>';
              }

              const replacement =
                '<div class="markUp" data-id="' + i + '" style="position: relative; display: inline-block; border-bottom: 1px dotted black">' +
                '<span data-id="' + i + '" style="text-decoration: underline wavy red; cursor: pointer;">' +
                wrongWord +
                '</span>' +
                // eslint-disable-next-line max-len
                '<div class="dropdownBlock" style="display: none; width: 160px; background-color: white; border-style: solid; border-color: var(--primary); color: #fff; text-align: center; border-radius: 6px; padding: 5px 0; position: absolute; z-index: 1000; bottom: 100%;">' +
                suggestionsHTML +
                '</div>' +
                '</div>';

              html = replacement + text.slice(end, lastFound) + html;
              lastFound = res.matches[i].offset;
            }
          }
          commentBody.innerHTML = text.slice(0, lastFound) + html;

          setTimeout(() => {
            Array.from(document.getElementsByClassName('markUp')).forEach(markup => {
              markup.addEventListener('click', () => {
                ((markup as HTMLElement).lastChild as HTMLElement).style.display = 'block';
                const rectdiv = (document.getElementById('answer-input')).getBoundingClientRect();
                const rectmarkup = markup.getBoundingClientRect();
                let offset;
                if (rectmarkup.x + rectmarkup.width / 2 > rectdiv.right - 80) {
                  offset = rectdiv.right - rectmarkup.x - rectmarkup.width;
                  ((markup as HTMLElement).lastChild as HTMLElement).style.right = -offset + 'px';
                } else if (rectmarkup.x + rectmarkup.width / 2 < rectdiv.left + 80) {
                  offset = rectmarkup.x - rectdiv.left;
                  ((markup as HTMLElement).lastChild as HTMLElement).style.left = -offset + 'px';
                } else {
                  ((markup as HTMLElement).lastChild as HTMLElement).style.left = '50%';
                  ((markup as HTMLElement).lastChild as HTMLElement).style.marginLeft = '-80px';
                }
                setTimeout(() => {
                  Array.from(document.getElementsByClassName('suggestions')).forEach(suggestion => {
                    suggestion.addEventListener('click', () => {
                      suggestion.parentElement.parentElement.outerHTML = suggestion.innerHTML;
                    });
                  });
                }, 500);
              });
            });
          }, 500);
        });
      }
    }, () => '', () => {
      this.isSpellchecking = false;
    });
  }

  checkLanguageConfidence(wordsCheck: any) {
    return this.selectedLang === 'auto' ? wordsCheck.language.detectedLanguage.confidence >= 0.5 : true;
  }

  checkSpellings(text: string, language: Language = this.selectedLang) {
    return this.languagetoolService.checkSpellings(text, language);
  }
}
