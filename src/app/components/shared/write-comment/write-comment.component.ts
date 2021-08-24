import { AfterViewInit, Component, ElementRef, Input, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Language, LanguagetoolResult, LanguagetoolService } from '../../../services/http/languagetool.service';
import { Comment } from '../../../models/comment';
import { User } from '../../../models/user';
import { NotificationService } from '../../../services/util/notification.service';
import { EventService } from '../../../services/util/event.service';
import { QuillEditorComponent } from 'ngx-quill';
import { CreateCommentKeywords } from '../../../utils/create-comment-keywords';

interface Mark {
  range: Range;
  marks: HTMLElement[];
}

@Component({
  selector: 'app-write-comment',
  templateUrl: './write-comment.component.html',
  styleUrls: ['./write-comment.component.scss']
})
export class WriteCommentComponent implements OnInit, AfterViewInit {

  @ViewChild('langSelect') langSelect: ElementRef<HTMLDivElement>;
  @ViewChild('editor') editor: QuillEditorComponent;
  @ViewChild('editorErrorLayer') editorErrorLayer: ElementRef<HTMLDivElement>;
  @Input() user: User;
  @Input() tags: string[];
  @Input() onClose: () => any;
  @Input() onSubmit: (commentText: string, selectedTag: string) => any;
  @Input() isSpinning = false;
  @Input() disableCancelButton = false;
  @Input() confirmLabel = 'save';
  @Input() cancelLabel = 'cancel';
  @Input() additionalTemplate: TemplateRef<any>;
  @Input() enabled = true;
  comment: Comment;
  selectedTag: string;
  currentHTML = '';
  currentText = '';
  //Grammarheck
  languages: Language[] = ['de-DE', 'en-US', 'fr', 'auto'];
  selectedLang: Language = 'auto';
  isSpellchecking = false;
  hasSpellcheckConfidence = true;
  newLang = 'auto';
  //Marks
  currentMarks: Mark[] = [];

  constructor(private notification: NotificationService,
              private translateService: TranslateService,
              public eventService: EventService,
              public languagetoolService: LanguagetoolService) {
  }

  private static calcNodeTextSize(node: Node): number {
    if (node instanceof HTMLBRElement) {
      return 1;
    }
    return node.textContent.length;
  }

  ngOnInit(): void {
    this.translateService.use(localStorage.getItem('currentLang'));
  }

  ngAfterViewInit() {
    this.editor.onContentChanged.subscribe(e => {
      this.currentHTML = e.html || '';
      this.currentText = e.text;
    });
    this.editor.onEditorCreated.subscribe(_ => {
      this.syncErrorLayer();
      setTimeout(() => this.syncErrorLayer(), 200); // animations?
    });
    this.editor.onEditorChanged.subscribe(_ => this.syncErrorLayer());
  }

  clearHTML(): void {
    this.editor.editorElem.innerHTML = '';
  }

  setHTML(html: string): void {
    this.editor.editorElem.innerHTML = html;
  }

  buildCloseDialogActionCallback(): () => void {
    if (!this.onClose || this.disableCancelButton) {
      return undefined;
    }
    return () => this.onClose();
  }

  buildCreateCommentActionCallback(): () => void {
    if (!this.onSubmit) {
      return undefined;
    }
    return () => {
      if (this.checkInputData(this.currentHTML)) {
        this.onSubmit(this.currentHTML, this.selectedTag);
      }
    };
  }

  syncErrorLayer(): void {
    const pos = this.editor.elementRef.nativeElement.getBoundingClientRect();
    const elem = this.editorErrorLayer.nativeElement;
    elem.style.width = pos.width + 'px';
    elem.style.height = pos.height + 'px';
    elem.style.marginBottom = '-' + elem.style.height;
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

  grammarCheck(rawText: string, langSelect: HTMLSpanElement): void {
    this.onDocumentClick({
      target: document
    });
    this.isSpellchecking = true;
    this.hasSpellcheckConfidence = true;
    const text = CreateCommentKeywords.cleaningFunction(rawText, true);
    this.checkSpellings(text).subscribe((wordsCheck) => {
      console.log(1);
      if (!this.checkLanguageConfidence(wordsCheck)) {
        this.hasSpellcheckConfidence = false;
        this.isSpellchecking = false;
        return;
      }
      // Hallo ich bin eine Entee. Ich liebe Gäse.
      if (this.selectedLang === 'auto' &&
        (langSelect.innerText.includes(this.newLang) || langSelect.innerText.includes('auto'))) {
        if (wordsCheck.language.name.includes('German')) {
          this.selectedLang = 'de-DE';
        } else if (wordsCheck.language.name.includes('English')) {
          this.selectedLang = 'en-US';
        } else if (wordsCheck.language.name.includes('French')) {
          this.selectedLang = 'fr';
        } else {
          this.newLang = wordsCheck.language.name;
        }
        langSelect.innerHTML = this.newLang;
      }
      this.buildMarks(rawText, wordsCheck.matches.map(err => text.slice(err.offset, err.offset + err.length)));
    }, () => {
      this.isSpellchecking = false;
    }, () => {
      this.isSpellchecking = false;
    });
  }

  buildMarks(initialText, wrongWords) {
    const errorDiv = this.editorErrorLayer.nativeElement;
    while (errorDiv.firstElementChild) {
      errorDiv.firstElementChild.remove();
    }
    this.currentMarks.length = 0;
    if (!wrongWords.length) {
      return;
    }
    let currentElement: Node = this.editor.editorElem.firstElementChild;
    let currentOffset = 0;
    let depth = 0;
    this.checkSpellings(initialText).subscribe((res) => {
      for (const match of res.matches) {
        const foundWord = initialText.slice(match.offset, match.offset + match.length);
        if (!wrongWords.includes(foundWord)) {
          continue;
        }
        let mark;
        [currentElement, currentOffset, depth, mark] = this.createMarkAndRange(depth, currentElement,
          currentOffset, match.offset, match.offset + match.length);
        this.currentMarks.push(mark);
      }
    });
  }

  checkLanguageConfidence(wordsCheck: any) {
    return this.selectedLang === 'auto' ? wordsCheck.language.detectedLanguage.confidence >= 0.5 : true;
  }

  checkSpellings(text: string, language: Language = this.selectedLang) {
    return this.languagetoolService.checkSpellings(text, language);
  }

  private createMarkAndRange(depth: number,
                             currentElement: Node,
                             currentOffset: number,
                             start: number,
                             end: number): [Node, number, number, Mark] {
    const range = document.createRange();
    const marks: HTMLElement[] = [];
    [currentElement, currentOffset, depth] = this.findNode(depth, currentElement, currentOffset, start);
    range.setStart(currentElement, start - currentOffset);
    [currentElement, currentOffset, depth] = this.findNode(depth, currentElement, currentOffset, end,
      (node: Node) => {
        //TODO Construct marks
      });
    range.setEnd(currentElement, end - currentOffset);
    return [currentElement, currentOffset, depth, { range, marks }];
  }

  private findNode(depth: number,
                   currentElement: Node,
                   currentOffset: number,
                   target: number,
                   onNodeLeave?: (Node) => void): [Node, number, number] {
    while (currentElement.firstChild) {
      currentElement = currentElement.firstChild;
      depth += 1;
    }
    let length = WriteCommentComponent.calcNodeTextSize(currentElement);
    while (currentOffset + length <= target) {
      if (onNodeLeave) {
        onNodeLeave(currentElement);
      }
      currentOffset += length;
      const wasAlreadyBreak = currentElement instanceof HTMLBRElement;
      let currentBefore = currentElement.parentElement;
      currentElement = currentElement.nextSibling;
      while (!currentElement) {
        if (depth === 0) {
          throw new Error('The requested text position was not inside the container.');
        }
        if (depth === 1 && !wasAlreadyBreak) {
          currentOffset += 1;
        }
        currentElement = currentBefore.nextSibling;
        currentBefore = currentBefore.parentElement;
      }
      while (currentElement.firstChild) {
        currentElement = currentElement.firstChild;
        depth += 1;
      }
      length = WriteCommentComponent.calcNodeTextSize(currentElement);
    }
    return [currentElement, currentOffset, depth];
  }

  private createSuggestionHTML(commentBody: HTMLDivElement, result: LanguagetoolResult, index: number, wrongWord: string) {
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
      const rectdiv = commentBody.getBoundingClientRect();
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

  private checkInputData(body: string): boolean {
    body = body.trim();
    if (!body) {
      this.translateService.get('comment-page.error-comment').subscribe(message => {
        this.notification.show(message);
      });
      return false;
    }
    return true;
  }

}
