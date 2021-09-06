import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { QuillEditorComponent, QuillModules, QuillViewComponent } from 'ngx-quill';
import Delta from 'quill-delta';
import Quill from 'quill';
import ImageResize from 'quill-image-resize-module';
import 'quill-emoji/dist/quill-emoji.js';
import { LanguageService } from '../../../services/util/language.service';
import { TranslateService } from '@ngx-translate/core';
import { DeviceInfoService } from '../../../services/util/device-info.service';

Quill.register('modules/imageResize', ImageResize);

const participantToolbar = [
  ['bold', { list: 'bullet' }, { list: 'ordered' }, 'blockquote', 'link', 'code-block', 'formula', 'emoji']
];

const moderatorToolbar = [
  ['bold', { color: [] }, 'strike', { list: 'bullet' }, { list: 'ordered' }, 'blockquote',
    'link', 'image', 'video', 'code-block', 'formula', 'emoji'],
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
  @Input() markEvents?: {
    onCreate: (markContainer: HTMLDivElement, tooltipContainer: HTMLDivElement, editor: QuillEditorComponent) => void;
    onChange: (delta: any) => void;
    onEditorChange: () => void;
    onDocumentClick: (e) => void;
  };
  currentText = '\n';
  quillModules: QuillModules = {
    toolbar: {
      container: participantToolbar,
      handlers: {
        image: () => this.handle('image'),
        video: () => this.handleVideo(),
        link: () => this.handleLink(),
        formula: () => this.handle('formula')
      }
    }
  };
  private _currentData = null;

  constructor(private languageService: LanguageService,
              private translateService: TranslateService,
              private deviceInfo: DeviceInfoService) {
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
    if (this.isModerator) {
      this.quillModules.toolbar['container'] = moderatorToolbar;
    }
    const isMobile = this.deviceInfo.isUserAgentMobile;
    if (this.isEditor) {
      this.quillModules['emoji-toolbar'] = !isMobile;
      this.quillModules['emoji-shortname'] = !isMobile;
      this.quillModules.imageResize = {
        modules: ['Resize', 'DisplaySize']
      };
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
        if (this.markEvents && this.markEvents.onCreate) {
          this.markEvents.onCreate(this.editorErrorLayer.nativeElement, this.tooltipContainer.nativeElement, this.editor);
        }
        if (this._currentData) {
          this.set(this._currentData);
        }
        (this.editor.editorElem.firstElementChild as HTMLElement).focus();
        this.syncErrorLayer();
        setTimeout(() => this.syncErrorLayer(), 200); // animations?
      });
      this.editor.onEditorChanged.subscribe(_ => {
        if (this.markEvents && this.markEvents.onEditorChange) {
          this.markEvents.onEditorChange();
        }
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
    this.recalcAspectRatio();
  }

  recalcAspectRatio() {
    const elem = this.isEditor ? this.editor.editorElem.firstElementChild : this.quillView.editorElem.firstElementChild;
    elem.querySelectorAll('.images .ql-video').forEach((e: HTMLElement) => {
      const width = parseFloat(window.getComputedStyle(e).width);
      e.style.height = (width * 9 / 16) + 'px';
    });
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

  private handleVideo(): void {
    const quill = this.editor.quillEditor;
    const tooltip = quill.theme.tooltip;
    const originalSave = tooltip.save;
    const originalHide = tooltip.hide;
    tooltip.save = () => {
      const range = quill.getSelection(true);
      const value = this.getVideoUrl(tooltip.textbox.value);
      if (value) {
        quill.insertEmbed(range.index, 'video', value, 'user');
      }
    };
    // Called on hide and save.
    tooltip.hide = () => {
      tooltip.save = originalSave;
      tooltip.hide = originalHide;
      tooltip.hide();
    };
    tooltip.edit('video');
    this.translateService.get('quill.tooltip-placeholder-video')
      .subscribe(translation => tooltip.textbox.placeholder = translation);
  }

  private getVideoUrl(url) {
    let match = url.match(/^(?:(https?):\/\/)?(?:(?:www|m)\.)?youtube\.com\/watch.*v=([a-zA-Z0-9_-]+)/) ||
      url.match(/^(?:(https?):\/\/)?(?:(?:www|m)\.)?youtu\.be\/([a-zA-Z0-9_-]+)/) ||
      url.match(/^.*(youtu.be\/|v\/|e\/|u\/\w+\/|embed\/|v=)([^#&?]*).*/);
    if (match && match[2].length === 11) {
      return 'https://www.youtube-nocookie.com/embed/' + match[2] + '?showinfo=0';
    }
    match = url.match(/^(?:(https?):\/\/)?(?:www\.)?vimeo\.com\/(\d+)/);
    if (match) {
      return (match[1] || 'https') + '://player.vimeo.com/video/' + match[2] + '/';
    }
    return null;
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
