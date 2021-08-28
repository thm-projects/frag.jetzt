import { AfterViewInit, Component, ElementRef, Input, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Language, LanguagetoolService } from '../../../services/http/languagetool.service';
import { Comment } from '../../../models/comment';
import { User } from '../../../models/user';
import { NotificationService } from '../../../services/util/notification.service';
import { EventService } from '../../../services/util/event.service';
import { QuillEditorComponent, QuillModules } from 'ngx-quill';
import { CreateCommentKeywords } from '../../../utils/create-comment-keywords';
import { Marks } from './write-comment.marks';
import { LanguageService } from '../../../services/util/language.service';
import Delta from 'quill-delta';
import Quill from 'quill';
import ImageResize from 'quill-image-resize-module';
import 'quill-emoji/dist/quill-emoji.js';

Quill.register('modules/imageResize', ImageResize);

const participantToolbar = [
  ['bold', 'strike'],
  ['blockquote', 'code-block'],
  [{ list: 'ordered' }, { list: 'bullet' }],
  ['link', 'formula']
];

const moderatorToolbar = [
  ['bold', 'strike'],
  ['blockquote', 'code-block'],
  [{ header: 1 }, { header: 2 }],
  [{ list: 'ordered' }, { list: 'bullet' }],
  [{ indent: '-1' }, { indent: '+1' }],
  [{ color: [] }],
  [{ align: [] }],
  ['link', 'image', 'video', 'formula']
];

@Component({
  selector: 'app-write-comment',
  templateUrl: './write-comment.component.html',
  styleUrls: ['./write-comment.component.scss']
})
export class WriteCommentComponent implements OnInit, AfterViewInit {

  @ViewChild('langSelect') langSelect: ElementRef<HTMLDivElement>;
  @ViewChild('editor') editor: QuillEditorComponent;
  @ViewChild('editorErrorLayer') editorErrorLayer: ElementRef<HTMLDivElement>;
  @ViewChild('tooltipContainer') tooltipContainer: ElementRef<HTMLDivElement>;
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
  marks: Marks;
  quillModules: QuillModules = {
    toolbar: {
      container: participantToolbar,
      handlers: {
        image: () => this.handle('image'),
        video: () => this.handle('video'),
        link: () => this.handleLink(),
        formula: () => this.handle('formula')
      }
    },
    'emoji-toolbar': true,
    'emoji-textarea': true,
    'emoji-shortname': true,
    imageResize: {
      modules: ['Resize', 'DisplaySize', 'Toolbar']
    }
  };

  constructor(private notification: NotificationService,
              private languageService: LanguageService,
              private translateService: TranslateService,
              public eventService: EventService,
              public languagetoolService: LanguagetoolService) {
    this.languageService.langEmitter.subscribe(lang => {
      this.translateService.use(lang);
      this.updateCSSVariables();
    });
  }

  ngOnInit(): void {
    this.translateService.use(localStorage.getItem('currentLang'));
    if (this.user && this.user.role > 0) {
      this.quillModules.toolbar['container'] = moderatorToolbar;
    }
    this.translateService.use(localStorage.getItem('currentLang'));
    this.updateCSSVariables();
  }

  ngAfterViewInit() {
    this.editor.onContentChanged.subscribe(e => {
      this.marks.onDataChange(e.delta);
      this.currentHTML = e.html || '';
      this.currentText = e.text;
    });
    this.editor.onEditorCreated.subscribe(_ => {
      this.marks = new Marks(this.editorErrorLayer.nativeElement, this.tooltipContainer.nativeElement, this.editor);
      this.syncErrorLayer();
      setTimeout(() => this.syncErrorLayer(), 200); // animations?
    });
    this.editor.onEditorChanged.subscribe(_ => {
      const elem: HTMLDivElement = document.querySelector('div.ql-tooltip');
      if (elem) { // fix tooltip
        setTimeout(() => {
          const left = parseFloat(elem.style.left);
          const right = left + elem.getBoundingClientRect().width;
          const containerWidth = this.editor.editorElem.getBoundingClientRect().width;
          if (left < 0) {
            elem.style.left = '0';
          } else if (right > containerWidth) {
            elem.style.left = (containerWidth - right + left) + 'px';
          }
        });
      }
      this.syncErrorLayer();
      this.marks.sync();
    });
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
    if (!this.marks) {
      return;
    }
    const range = this.editor.quillEditor.getSelection(false);
    this.marks.onClick(range && range.length === 0 ? range.index : null);
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

  private updateCSSVariables() {
    const variables = [
      'quill.tooltip-remove', 'quill.tooltip-action-save', 'quill.tooltip-action', 'quill.tooltip-label',
      'quill.tooltip-label-link', 'quill.tooltip-label-image', 'quill.tooltip-label-video',
      'quill.tooltip-label-formula'
    ];
    for (const variable of variables) {
      this.translateService.get(variable).subscribe(translation => {
        document.body.style.setProperty('--' + variable.replace('.', '-'), JSON.stringify(translation));
      });
    }
  }

  private handleLink(): void {
    const quill = this.editor.quillEditor;
    const selection = quill.getSelection(false);
    if (!selection || !selection.length) {
      return;
    }
    const tooltip = quill.theme.tooltip;
    const originalSave = tooltip.save;
    const originalHide = tooltip.hide;
    tooltip.save = () => {
      const value = tooltip.textbox.value;
      if (value) {
        const delta = new Delta()
          .retain(selection.index)
          .retain(selection.length, { link: value });
        quill.updateContents(delta);
        tooltip.hide();
      }
    };
    // Called on hide and save.
    tooltip.hide = () => {
      tooltip.save = originalSave;
      tooltip.hide = originalHide;
      tooltip.hide();
    };
    tooltip.edit('link');
    tooltip.textbox.value = quill.getText(selection.index, selection.length);
    this.translateService.get('quill.tooltip-placeholder-link')
      .subscribe(translation => tooltip.textbox.placeholder = translation);
  }

  private handle(type: string): void {
    const quill = this.editor.quillEditor;
    const tooltip = quill.theme.tooltip;
    const originalSave = tooltip.save;
    const originalHide = tooltip.hide;
    tooltip.save = () => {
      const range = quill.getSelection(true);
      const value = tooltip.textbox.value;
      if (value) {
        quill.insertEmbed(range.index, type, value, 'user');
      }
    };
    // Called on hide and save.
    tooltip.hide = () => {
      tooltip.save = originalSave;
      tooltip.hide = originalHide;
      tooltip.hide();
    };
    tooltip.edit(type);
    this.translateService.get('quill.tooltip-placeholder-' + type)
      .subscribe(translation => tooltip.textbox.placeholder = translation);
  }

}
