import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import { QuillEditorComponent, QuillModules, QuillViewComponent } from 'ngx-quill';
import Delta from 'quill-delta';
import Quill from 'quill';
import ImageResize from 'quill-image-resize-module';
import 'quill-emoji/dist/quill-emoji.js';
import { LanguageService } from '../../../services/util/language.service';
import { TranslateService } from '@ngx-translate/core';
import { DeviceInfoService } from '../../../services/util/device-info.service';
import { MatDialog } from '@angular/material/dialog';
import { QuillInputDialogComponent } from '../_dialogs/quill-input-dialog/quill-input-dialog.component';
import { Marks } from './view-comment-data.marks';
import { LanguagetoolResult } from '../../../services/http/languagetool.service';

Quill.register('modules/imageResize', ImageResize);

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
  @Input() isModerator = false;

  @Input()
  set currentData(data: string) {
    this._currentData = data;
    if ((this.editor && this.editor.quillEditor) || (this.quillView && this.quillView.quillEditor)) {
      this.set(this._currentData);
    }
  }

  get currentData(): string {
    return this._currentData || '';
  }

  @Input() maxTextCharacters = 500;
  @Input() maxDataCharacters = 1500;
  @Input() placeHolderText = '';
  @Input() afterEditorInit?: () => void;
  @Input() usesFormality = false;
  @Input() formalityEmitter: (string) => void;
  @Input() selectedFormality = 'default';
  currentText = '\n';
  quillModules: QuillModules = {};
  hasEmoji = true;
  private _currentData = null;
  private _marks: Marks;

  constructor(private languageService: LanguageService,
              private translateService: TranslateService,
              private deviceInfo: DeviceInfoService,
              private dialog: MatDialog) {
    this.languageService.langEmitter.subscribe(lang => {
      this.translateService.use(lang);
      if (this.isEditor) {
        this.updateCSSVariables();
      }
    });
  }

  public static getDataFromDelta(contentDelta) {
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

  public static getDeltaFromData(jsonData: string) {
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

  public static getTextFromData(jsonData: string): string {
    return JSON.parse(jsonData).reduce((acc, e) => {
      if (typeof e['insert'] === 'string') {
        return acc + e['insert'];
      } else if (typeof e === 'string') {
        return acc + e;
      }
      return acc;
    }, '');
  }


  ngOnInit(): void {
    const isMobile = this.deviceInfo.isUserAgentMobile;
    if (this.isEditor) {
      this.quillModules['emoji-toolbar'] = !isMobile;
      this.quillModules['emoji-shortname'] = !isMobile;
      this.quillModules.imageResize = {
        modules: ['Resize', 'DisplaySize']
      };
      this.hasEmoji = !isMobile;
    }
    this.translateService.use(localStorage.getItem('currentLang'));
    if (this.isEditor) {
      this.updateCSSVariables();
    }
  }

  ngAfterViewInit() {
    if (this.isEditor) {
      this.editor.onContentChanged.subscribe(e => {
        this._marks.onDataChange(e.delta);
        this._currentData = ViewCommentDataComponent.getDataFromDelta(e.content);
        this.currentText = e.text;
        // remove background
        const data = e.content;
        let changed = false;
        data.ops.forEach(op => {
          if (op.attributes && op.attributes.background) {
            changed = true;
            op.attributes.background = null;
            delete op.attributes.background;
          }
        });
        if (changed) {
          this.editor.quillEditor.setContents(data);
        }
      });
      this.editor.onEditorCreated.subscribe(_ => {
        this._marks = new Marks(this.editorErrorLayer.nativeElement, this.tooltipContainer.nativeElement, this.editor);
        if (this._currentData) {
          this.set(this._currentData);
        }
        (this.editor.editorElem.firstElementChild as HTMLElement).focus();
        this.overrideQuillTooltip();
        this.syncErrorLayer();
        setTimeout(() => {
          this.syncErrorLayer();
          if (this.afterEditorInit) {
            this.afterEditorInit();
          }
        }, 200); // animations?
      });
      this.editor.onEditorChanged.subscribe(_ => {
        this._marks.sync();
        this.syncErrorLayer();
        const elem: HTMLDivElement = document.querySelector('div.ql-tooltip');
        if (elem) {
          setTimeout(() => {
            let left = parseFloat(elem.style.left);
            const containerWidth = this.editor.editorElem.getBoundingClientRect().width;
            if (left < 0) {
              elem.style.left = '0';
              left = 0;
            }
            const right = left + elem.getBoundingClientRect().width;
            if (right > containerWidth) {
              elem.style.left = (containerWidth - right + left) + 'px';
            }
          });
        }
      });
    } else {
      this.quillView.onEditorCreated.subscribe(_ => {
        this.set(this._currentData);
      });
    }
  }

  onDocumentClick(e) {
    if (!this._marks) {
      return;
    }
    const range = this.editor.quillEditor.getSelection(false);
    this._marks.onClick(range && range.length === 0 ? range.index : null);
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
    this.recalcAspectRatio();
  }

  recalcAspectRatio() {
    const elem = this.isEditor ? this.editor.editorElem.firstElementChild : this.quillView.editorElem.firstElementChild;
    elem.querySelectorAll('.images .ql-video').forEach((e: HTMLElement) => {
      const width = parseFloat(window.getComputedStyle(e).width);
      e.style.height = (width * 9 / 16) + 'px';
    });
  }

  buildMarks(text: string, result: LanguagetoolResult) {
    this._marks.buildErrors(text, result);
  }

  copyMarks(viewCommentData: ViewCommentDataComponent) {
    if (viewCommentData === this) {
      return;
    }
    this._marks.copy(viewCommentData._marks);
  }

  public onClick(e: MouseEvent, type) {
    e.preventDefault();
    e.stopImmediatePropagation();
    this.handle(type);
    return false;
  }

  private overrideQuillTooltip() {
    const tooltip = this.editor.quillEditor.theme.tooltip;
    const prev = tooltip.show.bind(tooltip);
    let range;
    tooltip.show = () => {
      const sel = this.editor.quillEditor.getSelection(false);
      const delta = this.editor.quillEditor.getContents();
      let currentSize = 0;
      for (const op of delta.ops) {
        if (typeof op['insert'] === 'string') {
          const start = currentSize;
          const len = op['insert'].length;
          currentSize += len;
          if (sel.index < currentSize) {
            range = { index: start, length: len };
            break;
          }
        } else {
          currentSize += 1;
        }
      }
      prev();
    };
    tooltip.edit = (type: string, value: string) => {
      this.handle(type, value, (val: string) => {
        const delta = new Delta()
          .retain(range.index)
          .retain(range.length, { link: val });
        this.editor.quillEditor.updateContents(delta);
      });
    };
  }

  private handle(type: string, overrideMeta = '', overrideAction = null) {
    const quill = this.editor.quillEditor;
    let meta: any = null;
    const selection = quill.getSelection(false);
    if (overrideMeta) {
      meta = overrideMeta;
    } else if (type === 'link') {
      if (!selection || !selection.length) {
        return;
      }
    }
    this.dialog.open(QuillInputDialogComponent, {
      width: '900px',
      maxWidth: '100%',
      maxHeight: 'calc( 100vh - 20px )',
      autoFocus: false,
      data: {
        type,
        selection,
        quill,
        meta,
        overrideAction
      }
    });
  }

  private syncErrorLayer(): void {
    const pos = this.editor.elementRef.nativeElement.getBoundingClientRect();
    const elem = this.editorErrorLayer.nativeElement;
    elem.style.width = pos.width + 'px';
    elem.style.height = pos.height + 'px';
    elem.style.marginBottom = '-' + elem.style.height;
  }

  private updateCSSVariables() {
    const variables = ['quill.tooltip-remove', 'quill.tooltip-action', 'quill.tooltip-label'];
    for (const variable of variables) {
      this.translateService.get(variable).subscribe(translation => {
        document.body.style.setProperty('--' + variable.replace('.', '-'), JSON.stringify(translation));
      });
    }
  }

}
