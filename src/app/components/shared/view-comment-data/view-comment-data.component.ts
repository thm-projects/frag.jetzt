import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import {
  EditorChangeContent,
  EditorChangeSelection,
  QuillEditorComponent,
  QuillModules,
  QuillViewComponent,
} from 'ngx-quill';
import { TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { QuillInputDialogComponent } from '../_dialogs/quill-input-dialog/quill-input-dialog.component';
import { Marks } from './view-comment-data.marks';
import { LanguagetoolResult } from '../../../services/http/languagetool.service';
import { NotificationService } from '../../../services/util/notification.service';
import { AccessibilityEscapedInputDirective } from '../../../directives/accessibility-escaped-input.directive';
import { EventService } from '../../../services/util/event.service';
import { MatTooltip } from '@angular/material/tooltip';
import {
  ImmutableStandardDelta,
  QuillUtils,
  StandardDelta,
} from '../../../utils/quill-utils';
import { ReplaySubject, takeUntil } from 'rxjs';
import { HighlightLibrary } from 'ngx-highlightjs/lib/highlight.model';

import Quill from 'quill';
import ImageResize from 'quill-image-resize-module';
import { DsgvoVideo } from '../../../quill-extentions/formats/dsgvo-video';
import { FullscreenImageDialogComponent } from '../_dialogs/fullscreen-image-dialog/fullscreen-image-dialog.component';
import { KeyboardUtils } from 'app/utils/keyboard';
import { KeyboardKey } from 'app/utils/keyboard/keys';
import { AppStateService } from 'app/services/state/app-state.service';
import { DeviceStateService } from 'app/services/state/device-state.service';

Quill.register('modules/imageResize', ImageResize);
Quill.register('formats/dsgvo-video', DsgvoVideo);

@Component({
  selector: 'app-view-comment-data',
  templateUrl: './view-comment-data.component.html',
  styleUrls: ['./view-comment-data.component.scss'],
})
export class ViewCommentDataComponent
  implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('editor') editor: QuillEditorComponent;
  @ViewChild('quillView') quillView: QuillViewComponent;
  @ViewChild('editorErrorLayer') editorErrorLayer: ElementRef<HTMLDivElement>;
  @ViewChild('tooltipContainer') tooltipContainer: ElementRef<HTMLDivElement>;
  @ViewChild('moderatorToolbarFontColor')
  moderatorToolbarFontColor: ElementRef<HTMLSelectElement>;
  @ViewChild('moderatorToolbarFontColorTooltip')
  moderatorToolbarFontColorTooltip: MatTooltip;
  @Input() textOverwrite: string = null;
  @Input() isEditor = false;
  @Input() isBrainstorming = false;
  @Input() isModerator = false;
  @Input() maxTextCharacters = 500;
  @Input() maxDataCharacters = 1500;
  @Input() placeHolderText = '';
  @Input() afterEditorInit?: () => void;
  @Input() usesFormality = false;
  @Input() formalityEmitter: (string) => void;
  @Input() selectedFormality = 'default';
  @Input() disableVideo = false;
  @Input() disableColor = false;
  @Input() disableEmoji = false;
  @Input() onEnter: (modifier: boolean) => void;
  @Output() changeContent = new EventEmitter<
    [ImmutableStandardDelta, string]
  >();
  currentText = '\n';
  quillModules: QuillModules = {};
  hasEmoji = true;
  private _initialized = false;
  private _currentData: StandardDelta = null;
  private _marks: Marks;
  private _destroyer = new ReplaySubject(1);
  private _mutateObserver: MutationObserver;
  private readonly DEFAULT_VALUE: StandardDelta = { ops: [{ insert: '\n' }] };

  constructor(
    private appState: AppStateService,
    private translateService: TranslateService,
    private deviceState: DeviceStateService,
    private eventService: EventService,
    private dialog: MatDialog,
  ) {
    DsgvoVideo.translator = translateService;
    this.appState.language$.pipe(takeUntil(this._destroyer)).subscribe((_) => {
      if (this.isEditor) {
        this.updateCSSVariables();
      }
    });
  }

  get initialized(): boolean {
    return this._initialized;
  }

  get currentData(): StandardDelta {
    return this._currentData || this.DEFAULT_VALUE;
  }

  @Input() set currentData(data: StandardDelta) {
    this._currentData = data;
    if (this.editor?.quillEditor || this.quillView?.quillEditor) {
      this.set(this._currentData);
    }
  }

  public static checkInputData(
    data: StandardDelta,
    text: string,
    translateService: TranslateService,
    notificationService: NotificationService,
    maxTextCharacters: number,
    maxDataCharacters: number,
  ): boolean {
    text = text.trim();
    if (QuillUtils.getContentCount(data) < 1) {
      translateService
        .get('comment-page.error-comment')
        .subscribe((message) => {
          notificationService.show(message);
        });
      return false;
    } else if (text.length > maxTextCharacters) {
      translateService
        .get('comment-page.error-comment-text')
        .subscribe((message) => {
          notificationService.show(message);
        });
      return false;
    } else if (QuillUtils.serializeDelta(data).length > maxDataCharacters) {
      translateService
        .get('comment-page.error-comment-data')
        .subscribe((message) => {
          notificationService.show(message);
        });
      return false;
    }
    return true;
  }

  ngOnInit(): void {
    const isMobile = this.deviceState.isMobile();
    const hljs = window['hljs'] as HighlightLibrary;
    this.quillModules.syntax = {
      highlight: (text) =>
        hljs ? hljs.highlightAuto(text, undefined).value : text,
    } as unknown as boolean;
    if (this.isEditor) {
      this.quillModules['emoji-toolbar'] = !isMobile;
      this.quillModules.imageResize = {
        modules: ['Resize', 'DisplaySize'],
      };
      this.hasEmoji = !isMobile;
    }
    if (this.isEditor) {
      this.updateCSSVariables();
    }
  }

  ngAfterViewInit() {
    if (!this.isEditor) {
      const startup = () => {
        this.set(this._currentData);
        this.quillView.editorElem.addEventListener('click', (e) => {
          const target = e.target;
          if (target instanceof HTMLImageElement && target?.['__blot']?.blot) {
            const ref = this.dialog.open(FullscreenImageDialogComponent);
            ref.componentInstance.src = target.src;
            document.body.requestFullscreen();
            ref.afterClosed().subscribe({
              next: () => {
                document.exitFullscreen();
              },
            });
          }
        });
      };
      if (this.quillView.editorElem) {
        startup();
        return;
      }
      this.quillView.onEditorCreated.subscribe((_) => {
        startup();
      });
      return;
    }
    let wasLastPaste = false;
    const initEditor = () => {
      this._marks = new Marks(
        this.editorErrorLayer.nativeElement,
        this.tooltipContainer.nativeElement,
        this.editor,
      );
      if (this._currentData) {
        this.set(this._currentData);
      }
      const elem = this.editor.editorElem.firstElementChild as HTMLElement;
      elem.focus();
      elem.addEventListener('paste', () => {
        wasLastPaste = true;
      });
      elem.addEventListener('keydown', (e) => {
        if (!KeyboardUtils.isKeyEvent(e, KeyboardKey.Enter)) {
          return;
        }
        const hasModifier =
          e.getModifierState('Meta') ||
          e.getModifierState('Alt') ||
          e.getModifierState('AltGraph') ||
          e.getModifierState('Control') ||
          e.getModifierState('Shift');
        this.onEnter?.(hasModifier);
      });
      new AccessibilityEscapedInputDirective(
        new ElementRef(this.editor.editorElem.firstElementChild as HTMLElement),
        this.eventService,
      ).ngAfterViewInit();
      this.initMaterialTooltip();
      this.overrideQuillTooltip();
      this.syncErrorLayer();
      this.afterEditorInit?.();
      this._initialized = true;
    };
    if (this.editor.editorElem) {
      initEditor();
    } else {
      this.editor.onEditorCreated.subscribe((_) => initEditor());
    }
    this.editor.onContentChanged.subscribe((e) => {
      this._marks.onDataChange(e.delta);
      this._currentData = e.content;
      this.currentText = e.text;
      this.changeContent.emit([e.content, e.text]);
    });
    this.editor.onEditorChanged.subscribe((e) => {
      wasLastPaste = this.onEditorChange(e, wasLastPaste);
    });
  }

  ngOnDestroy() {
    this._destroyer.next(1);
    this._destroyer.complete();
    this._mutateObserver?.disconnect?.();
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

  set(delta: StandardDelta): void {
    if (!this._mutateObserver) {
      this._mutateObserver = new MutationObserver(this.onMutate.bind(this));
      const target = this.isEditor
        ? this.editor.editorElem
        : this.quillView.editorElem;
      this._mutateObserver.observe(target.firstElementChild, {
        childList: true,
      });
    }
    if (this.isEditor) {
      this.editor.quillEditor.setContents(delta);
    } else {
      this.quillView.quillEditor.setContents(delta);
    }
    this.recalcAspectRatio();
  }

  recalcAspectRatio() {
    const elem = this.isEditor
      ? this.editor.editorElem.firstElementChild
      : this.quillView.editorElem.firstElementChild;
    elem.querySelectorAll('.images .ql-video').forEach((e: HTMLElement) => {
      const width = parseFloat(window.getComputedStyle(e).width);
      e.style.height = (width * 9) / 16 + 'px';
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
    const tooltip =
      this.moderatorToolbarFontColor?.nativeElement?.previousElementSibling;
    if (!tooltip) {
      return;
    }
    this.moderatorToolbarFontColor.nativeElement.style.opacity = '0';
    tooltip.addEventListener('mouseenter', () =>
      this.moderatorToolbarFontColorTooltip?.show(),
    );
    tooltip.addEventListener('mouseleave', () =>
      this.moderatorToolbarFontColorTooltip?.hide(),
    );
    const picker = tooltip.querySelector('.ql-picker-options');
    tooltip.addEventListener('mouseover', (e) => {
      if (picker.contains(e.target as Node)) {
        this.moderatorToolbarFontColorTooltip?.hide();
      } else {
        this.moderatorToolbarFontColorTooltip?.show();
      }
    });
  }

  private onEditorChange(
    e: EditorChangeContent | EditorChangeSelection,
    wasLastPaste: boolean,
  ): boolean {
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
        const containerWidth =
          this.editor.editorElem.getBoundingClientRect().width;
        if (left < 0) {
          tooltip.style.left = '0';
          left = 0;
        }
        const right = left + tooltip.getBoundingClientRect().width;
        if (right > containerWidth) {
          tooltip.style.left = containerWidth - right + left + 'px';
        }
      });
    }
    return wasLastPaste;
  }

  private cleanContentOnPaste(event: EditorChangeContent) {
    if (event.source !== 'user') {
      return;
    }
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
    this.editor.quillEditor.setContents(event.oldDelta, 'silent');
    this.editor.quillEditor.updateContents(newDelta, 'silent');
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
        overrideAction,
      },
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
    const variables = [
      'quill.tooltip-remove',
      'quill.tooltip-action',
      'quill.tooltip-label',
    ];
    for (const variable of variables) {
      this.translateService.get(variable).subscribe((translation) => {
        document.body.style.setProperty(
          '--' + variable.replace('.', '-'),
          JSON.stringify(translation),
        );
      });
    }
  }

  private onMutate(mutations: MutationRecord[], _observer: MutationObserver) {
    for (const mutation of mutations) {
      Array.from(mutation.addedNodes).forEach((node) => {
        if (
          node instanceof HTMLPreElement &&
          node.classList.contains('ql-syntax')
        ) {
          node.classList.toggle('hljs', true);
        }
      });
    }
  }
}
