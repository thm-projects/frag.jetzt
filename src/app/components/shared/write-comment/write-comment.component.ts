import { AfterViewInit, Component, ElementRef, Input, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Language, LanguagetoolService } from '../../../services/http/languagetool.service';
import { Comment } from '../../../models/comment';
import { User } from '../../../models/user';
import { NotificationService } from '../../../services/util/notification.service';
import { EventService } from '../../../services/util/event.service';
import { CreateCommentKeywords } from '../../../utils/create-comment-keywords';
import { Marks } from './write-comment.marks';
import { LanguageService } from '../../../services/util/language.service';
import { QuillEditorComponent } from 'ngx-quill';
import { ViewCommentDataComponent } from '../view-comment-data/view-comment-data.component';


@Component({
  selector: 'app-write-comment',
  templateUrl: './write-comment.component.html',
  styleUrls: ['./write-comment.component.scss']
})
export class WriteCommentComponent implements OnInit {

  @ViewChild(ViewCommentDataComponent) commentData: ViewCommentDataComponent;
  @ViewChild('langSelect') langSelect: ElementRef<HTMLDivElement>;
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
  // Grammarheck
  languages: Language[] = ['de-DE', 'en-US', 'fr', 'auto'];
  selectedLang: Language = 'auto';
  isSpellchecking = false;
  hasSpellcheckConfidence = true;
  newLang = 'auto';
  // Marks
  marks: Marks;

  constructor(private notification: NotificationService,
              private languageService: LanguageService,
              private translateService: TranslateService,
              public eventService: EventService,
              public languagetoolService: LanguagetoolService) {
    this.languageService.langEmitter.subscribe(lang => {
      this.translateService.use(lang);
    });
  }

  ngOnInit(): void {
    this.translateService.use(localStorage.getItem('currentLang'));
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
      if (this.checkInputData(this.commentData.currentData)) {
        this.onSubmit(this.commentData.currentData, this.selectedTag);
      }
    };
  }

  onDocumentClick(e) {
    if (!this.marks) {
      return;
    }
    const range = this.commentData.editor.quillEditor.getSelection(false);
    this.marks.onClick(range && range.length === 0 ? range.index : null);
  }

  checkGrammar() {
    this.grammarCheck(this.commentData.currentText, this.langSelect && this.langSelect.nativeElement);
  }

  grammarCheck(rawText: string, langSelect: HTMLSpanElement): void {
    this.onDocumentClick({
      target: document
    });
    this.isSpellchecking = true;
    this.hasSpellcheckConfidence = true;
    const text = CreateCommentKeywords.cleaningFunction(rawText, true);
    this.checkSpellings(text).subscribe((wordsCheck) => {
      if (!this.checkLanguageConfidence(wordsCheck)) {
        this.hasSpellcheckConfidence = false;
        this.isSpellchecking = false;
        return;
      }
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
      this.marks.clear();
      const wrongWords = wordsCheck.matches.map(err => text.slice(err.offset, err.offset + err.length));
      if (!wrongWords.length) {
        return;
      }
      this.checkSpellings(rawText).subscribe((res) => this.marks.buildErrors(rawText, wrongWords, res));
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

  getMarkEvents() {
    return {
      onCreate: (markContainer: HTMLDivElement, tooltipContainer: HTMLDivElement, editor: QuillEditorComponent) => {
        this.marks = new Marks(markContainer, tooltipContainer, editor);
      },
      onChange: (delta: any) => {
        this.marks.onDataChange(delta);
      },
      onEditorChange: () => {
        const elem: HTMLDivElement = document.querySelector('div.ql-tooltip');
        if (elem) { // fix tooltip
          setTimeout(() => {
            const left = parseFloat(elem.style.left);
            const right = left + elem.getBoundingClientRect().width;
            const containerWidth = this.commentData.editor.editorElem.getBoundingClientRect().width;
            if (left < 0) {
              elem.style.left = '0';
            } else if (right > containerWidth) {
              elem.style.left = (containerWidth - right + left) + 'px';
            }
          });
        }
        this.marks.sync();
      },
      onDocumentClick: (e) => this.onDocumentClick(e)
    };
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
