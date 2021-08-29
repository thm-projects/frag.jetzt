import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { User } from '../../../models/user';
import { QuillEditorComponent, QuillModules, QuillViewComponent } from 'ngx-quill';
import Delta from 'quill-delta';
import Quill from 'quill';
import ImageResize from 'quill-image-resize-module';
import 'quill-emoji/dist/quill-emoji.js';
import { LanguageService } from '../../../services/util/language.service';
import { TranslateService } from '@ngx-translate/core';

Quill.register('modules/imageResize', ImageResize);

const participantToolbar = [
  ['bold', 'strike'],
  ['blockquote', 'code-block'],
  [{ list: 'ordered' }, { list: 'bullet' }],
  ['link', 'formula'],
  ['emoji']
];

const moderatorToolbar = [
  ['bold', 'strike'],
  ['blockquote', 'code-block'],
  [{ header: 1 }, { header: 2 }],
  [{ list: 'ordered' }, { list: 'bullet' }],
  [{ indent: '-1' }, { indent: '+1' }],
  [{ color: [] }],
  [{ align: [] }],
  ['link', 'image', 'video', 'formula'],
  ['emoji']
];

@Component({
  selector: 'app-view-comment-data',
  templateUrl: './view-comment-data.component.html',
  styleUrls: ['./view-comment-data.component.scss']
})
export class ViewCommentDataComponent implements OnInit, AfterViewInit {

  @ViewChild('editor') editor: QuillEditorComponent;
  @ViewChild('quillView') quillView: QuillViewComponent;
  @ViewChild('editorErrorLayer') editorErrorLayer: ElementRef<HTMLDivElement>;
  @ViewChild('tooltipContainer') tooltipContainer: ElementRef<HTMLDivElement>;
  @Input() isEditor = false;
  @Input() user: User;
  @Input() currentData = '';
  @Input() markEvents?: {
    onCreate: (markContainer: HTMLDivElement, tooltipContainer: HTMLDivElement, editor: QuillEditorComponent) => void;
    onChange: (delta: any) => void;
    onEditorChange: () => void;
    onDocumentClick: (e) => void;
  };
  currentText = '';

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
    'emoji-shortname': true,
    imageResize: {
      modules: ['Resize', 'DisplaySize']
    }
  };

  constructor(private languageService: LanguageService,
              private translateService: TranslateService) {
    this.languageService.langEmitter.subscribe(lang => {
      this.translateService.use(lang);
      if (this.isEditor) {
        this.updateCSSVariables();
      }
    });
  }

  private static getDataFromDelta(contentDelta) {
    return JSON.stringify(contentDelta.ops.map(op => {
      let hasOnlyInsert = true;
      for (const key in op) {
        if (key !== 'insert') {
          hasOnlyInsert = false;
          break;
        }
      }
      return hasOnlyInsert ? op['insert'] : op;
    }));
  }

  private static getDeltaFromData(jsonData: string) {
    return {
      ops: JSON.parse(jsonData).map(elem => {
        if (!elem['insert']) {
          return { insert: elem };
        } else {
          return elem;
        }
      })
    };
  }

  ngOnInit(): void {
    if (this.user && this.user.role > 0) {
      this.quillModules.toolbar['container'] = moderatorToolbar;
    }
    this.translateService.use(localStorage.getItem('currentLang'));
    if (this.isEditor) {
      this.updateCSSVariables();
    }
  }

  ngAfterViewInit() {
    if (this.isEditor) {
      this.editor.onContentChanged.subscribe(e => {
        if (this.markEvents && this.markEvents.onChange) {
          this.markEvents.onChange(e.delta);
        }
        this.currentData = ViewCommentDataComponent.getDataFromDelta(e.content);
        this.currentText = e.text;
      });
      this.editor.onEditorCreated.subscribe(_ => {
        if (this.markEvents && this.markEvents.onCreate) {
          this.markEvents.onCreate(this.editorErrorLayer.nativeElement, this.tooltipContainer.nativeElement, this.editor);
        }
        this.syncErrorLayer();
        setTimeout(() => this.syncErrorLayer(), 200); // animations?
      });
      this.editor.onEditorChanged.subscribe(_ => {
        if (this.markEvents && this.markEvents.onEditorChange) {
          this.markEvents.onEditorChange();
        }
        this.syncErrorLayer();
      });
    } else {
      this.quillView.onEditorCreated.subscribe(_ => {
        this.set(this.currentData);
      });
    }
  }

  onDocumentClick(e) {
    if (this.markEvents && this.markEvents.onDocumentClick) {
      this.markEvents.onDocumentClick(e);
    }
  }

  clear(): void {
    const delta = new Delta();
    if (this.isEditor) {
      this.editor.quillEditor.setContents(delta);
    } else {
      this.quillView.quillEditor.setContents(delta);
    }
  }

  set(jsonData: string): void {
    const delta = ViewCommentDataComponent.getDeltaFromData(jsonData);
    if (this.isEditor) {
      this.editor.quillEditor.setContents(delta);
    } else {
      this.quillView.quillEditor.setContents(delta);
    }
  }

  private syncErrorLayer(): void {
    const pos = this.editor.elementRef.nativeElement.getBoundingClientRect();
    const elem = this.editorErrorLayer.nativeElement;
    elem.style.width = pos.width + 'px';
    elem.style.height = pos.height + 'px';
    elem.style.marginBottom = '-' + elem.style.height;
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

}
