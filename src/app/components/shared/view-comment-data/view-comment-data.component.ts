import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  EditorChangeContent,
  EditorChangeSelection,
  QuillEditorComponent,
  QuillModules,
  QuillViewComponent
} from 'ngx-quill';
import { LanguageService } from '../../../services/util/language.service';
import { TranslateService } from '@ngx-translate/core';
import { DeviceInfoService } from '../../../services/util/device-info.service';
import { MatDialog } from '@angular/material/dialog';
import { QuillInputDialogComponent } from '../_dialogs/quill-input-dialog/quill-input-dialog.component';
import { Marks } from './view-comment-data.marks';
import { LanguagetoolResult } from '../../../services/http/languagetool.service';
import { NotificationService } from '../../../services/util/notification.service';
import { AccessibilityEscapedInputDirective } from '../../../directives/accessibility-escaped-input.directive';
import { EventService } from '../../../services/util/event.service';
import { MatTooltip } from '@angular/material/tooltip';

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
  @ViewChild('moderatorToolbarFontColor') moderatorToolbarFontColor: ElementRef<HTMLSelectElement>;
  @ViewChild('moderatorToolbarFontColorTooltip') moderatorToolbarFontColorTooltip: MatTooltip;
  @Input() textOverwrite: string = null;
  @Input() isEditor = false;
  @Input() isBrainstorming = false;
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

  constructor(
    private languageService: LanguageService,
    private translateService: TranslateService,
    private deviceInfo: DeviceInfoService,
    private eventService: EventService,
    private dialog: MatDialog
  ) {
    this.languageService.getLanguage().subscribe(lang => {
      this.translateService.use(lang);
      if (this.isEditor) {
        this.updateCSSVariables();
      }
    });
  }

  public static checkInputData(data: string,
                               text: string,
                               translateService: TranslateService,
                               notificationService: NotificationService,
                               maxTextCharacters: number,
                               maxDataCharacters: number): boolean {
    text = text.trim();
    if (this.getContentCount(data) < 1) {
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

  private static getContentCount(data: string): number {
    if (!data) {
      return 0;
    }
    return JSON.parse(data).reduce((acc, k) => {
      if (typeof k === 'string') {
        return k.trim().length > 0 ? acc + 1 : acc;
      }
      if (k.insert) {
        return k.insert?.trim?.()?.length ? acc + 1 : acc;
      }
      return acc + 1;
    }, 0);
  }

  ngOnInit(): void {
    const isMobile = this.deviceInfo.isUserAgentMobile;
    if (this.isEditor) {
      this.quillModules['emoji-toolbar'] = !isMobile;
      this.quillModules.imageResize = {
        modules: ['Resize', 'DisplaySize']
      };
      this.hasEmoji = !isMobile;
    }
    if (this.isEditor) {
      this.updateCSSVariables();
    }
  }

  ngAfterViewInit() {
    if (!this.isEditor) {
      if (this.quillView.editorElem) {
        this.set(this._currentData);
        return;
      }
      this.quillView.onEditorCreated.subscribe(_ => {
        this.set(this._currentData);
      });
      return;
    }
    let wasLastPaste = false;
    const initEditor = () => {
      this._marks = new Marks(this.editorErrorLayer.nativeElement, this.tooltipContainer.nativeElement, this.editor);
      if (this._currentData) {
        this.set(this._currentData);
      }
      const elem = this.editor.editorElem.firstElementChild as HTMLElement;
      elem.focus();
      elem.addEventListener('paste', () => {
        wasLastPaste = true;
      });
      new AccessibilityEscapedInputDirective(
        new ElementRef(this.editor.editorElem.firstElementChild as HTMLElement),
        this.eventService
      ).ngAfterViewInit();
      this.initMaterialTooltip();
      this.overrideQuillTooltip();
      this.syncErrorLayer();
      if (this.afterEditorInit) {
        this.afterEditorInit();
      }
    };
    if (this.editor.editorElem) {
      initEditor();
    } else {
      this.editor.onEditorCreated.subscribe(_ => initEditor());
    }
    this.editor.onContentChanged.subscribe(e => {
      this._marks.onDataChange(e.delta);
      this._currentData = ViewCommentDataComponent.getDataFromDelta(e.content);
      this.currentText = e.text;
    });
    this.editor.onEditorChanged.subscribe(e => {
      wasLastPaste = this.onEditorChange(e, wasLastPaste);
    });
  }

  onDocumentClick(e) {
    if (!this._marks) {
      return;
    }
    const range = this.editor.quillEditor.getSelection(false);
    this._marks.onClick(range && range.length === 0 ? range.index : null);
  }

  clear(): void {
    if (this.isEditor) {
      this.editor.quillEditor.setContents({ ops: [] });
    } else {
      this.quillView.quillEditor.setContents({ ops: [] });
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

  private initMaterialTooltip() {
    const tooltip = this.moderatorToolbarFontColor?.nativeElement?.previousElementSibling;
    if (!tooltip) {
      return;
    }
    this.moderatorToolbarFontColor.nativeElement.style.opacity = '0';
    tooltip.addEventListener('mouseenter', () => this.moderatorToolbarFontColorTooltip.show());
    tooltip.addEventListener('mouseleave', () => this.moderatorToolbarFontColorTooltip.hide());
    const picker = tooltip.querySelector('.ql-picker-options');
    tooltip.addEventListener('mouseover', e => {
      if (picker.contains(e.target as Node)) {
        this.moderatorToolbarFontColorTooltip.hide();
      } else {
        this.moderatorToolbarFontColorTooltip.show();
      }
    });
  }

  private onEditorChange(e: EditorChangeContent | EditorChangeSelection, wasLastPaste: boolean): boolean {
    if (e.event === 'text-change' && wasLastPaste) {
      wasLastPaste = false;
      this.cleanContentOnPaste(e);
    }
    this._marks.sync();
    this.syncErrorLayer();
    const tooltip: HTMLDivElement = document.querySelector('div.ql-tooltip');
    if (tooltip) {
      setTimeout(() => {
        let left = parseFloat(tooltip.style.left);
        const containerWidth = this.editor.editorElem.getBoundingClientRect().width;
        if (left < 0) {
          tooltip.style.left = '0';
          left = 0;
        }
        const right = left + tooltip.getBoundingClientRect().width;
        if (right > containerWidth) {
          tooltip.style.left = (containerWidth - right + left) + 'px';
        }
      });
    }
    return wasLastPaste;
  }

  private cleanContentOnPaste(event: EditorChangeContent) {
    const newDelta = { ops: [] };
    for (const deltaObj of event.delta.ops) {
      if (deltaObj.retain) {
        newDelta.ops.push({ retain: deltaObj.retain });
        continue;
      }
      if (deltaObj.delete) {
        newDelta.ops.push({ delete: deltaObj.delete });
        continue;
      }
      if (!deltaObj.insert) {
        continue;
      }
      const lastObj = newDelta.ops[newDelta.ops.length - 1];
      if (lastObj?.insert) {
        lastObj.insert += deltaObj.insert;
      } else {
        newDelta.ops.push({ insert: deltaObj.insert });
      }
    }
    this.editor.quillEditor.setContents(event.oldDelta);
    this.editor.quillEditor.updateContents(newDelta);
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
        const ops = [];
        const startIndex = range.index;
        if (startIndex > 0) {
          ops.push({ retain: startIndex });
        }
        ops.push({
          retain: range.length,
          attributes: { link: val },
        });
        this.editor.quillEditor.updateContents({ ops });
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
