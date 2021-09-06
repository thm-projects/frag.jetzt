import { Component, ElementRef, Input, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Language, LanguagetoolService } from '../../../services/http/languagetool.service';
import { Comment } from '../../../models/comment';
import { NotificationService } from '../../../services/util/notification.service';
import { EventService } from '../../../services/util/event.service';
import { Marks } from './write-comment.marks';
import { LanguageService } from '../../../services/util/language.service';
import { QuillEditorComponent } from 'ngx-quill';
import { ViewCommentDataComponent } from '../view-comment-data/view-comment-data.component';
import { DeepLService } from '../../../services/http/deep-l.service';

@Component({
  selector: 'app-write-comment',
  templateUrl: './write-comment.component.html',
  styleUrls: ['./write-comment.component.scss']
})
export class WriteCommentComponent implements OnInit {

  @ViewChild(ViewCommentDataComponent) commentData: ViewCommentDataComponent;
  @ViewChild('langSelect') langSelect: ElementRef<HTMLDivElement>;
  @Input() isModerator = false;
  @Input() tags: string[];
  @Input() onClose: () => any;
  @Input() onSubmit: (commentData: string, commentText: string, selectedTag: string) => any;
  @Input() isSpinning = false;
  @Input() disableCancelButton = false;
  @Input() confirmLabel = 'save';
  @Input() cancelLabel = 'cancel';
  @Input() additionalTemplate: TemplateRef<any>;
  @Input() enabled = true;
  @Input() isCommentAnswer = false;
  @Input() placeholder = 'comment-page.enter-comment';
  @Input() i18nSection = 'comment-page';
  comment: Comment;
  selectedTag: string;
  maxTextCharacters = 500;
  maxDataCharacters = 2500;
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
              public languagetoolService: LanguagetoolService,
              public deepl: DeepLService) {
    this.languageService.langEmitter.subscribe(lang => {
      this.translateService.use(lang);
    });
  }

  public static checkInputData(data: string,
                               text: string,
                               translateService: TranslateService,
                               notificationService: NotificationService,
                               maxTextCharacters: number,
                               maxDataCharacters: number): boolean {
    text = text.trim();
    if (!text.length) {
      translateService.get('comment-page.error-comment').subscribe(message => {
        notificationService.show(message);
      });
      return false;
    } else if (text.length > maxTextCharacters) {
      translateService.get('comment-page.error-comment-text').subscribe(message => {
        notificationService.show(message);
      });
      return false;
    } else if (data.length > maxDataCharacters) {
      translateService.get('comment-page.error-comment-data').subscribe(message => {
        notificationService.show(message);
      });
      return false;
    }
    return true;
  }

  ngOnInit(): void {
    this.translateService.use(localStorage.getItem('currentLang'));
    if (this.isCommentAnswer) {
      this.maxTextCharacters = this.isModerator ? 2000 : 0;
    } else {
      this.maxTextCharacters = this.isModerator ? 1000 : 500;
    }
    this.maxDataCharacters = this.isModerator ? this.maxTextCharacters * 5 : this.maxTextCharacters * 3;
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
      if (WriteCommentComponent.checkInputData(this.commentData.currentData, this.commentData.currentText,
        this.translateService, this.notification, this.maxTextCharacters, this.maxDataCharacters)) {
        this.onSubmit(this.commentData.currentData, this.commentData.currentText, this.selectedTag);
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
    this.checkSpellings(rawText).subscribe((wordsCheck) => {
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
      this.marks.buildErrors(rawText, wordsCheck);
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
        this.marks.sync();
      },
      onDocumentClick: (e) => this.onDocumentClick(e)
    };
  }

}
