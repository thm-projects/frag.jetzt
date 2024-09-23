import rawI18n from './i18n.json';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
const i18n = I18nLoader.load(rawI18n);
import {
  AfterViewInit,
  Component,
  ElementRef,
  Injector,
  Renderer2,
  TemplateRef,
  ViewContainerRef,
  computed,
  effect,
  inject,
  input,
  model,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import Editor, { EditorType } from '@toast-ui/editor';
import {
  MD_CUSTOM_TEXT_RENDERER,
  MD_PLUGINS,
} from '../markdown-common/plugins';
import { language } from 'app/base/language/language';
import { windowWatcher } from 'modules/navigation/utils/window-watcher';
import { ToolbarItemOptions } from '@toast-ui/editor/types/ui';

@Component({
  selector: 'app-markdown-editor',
  templateUrl: './markdown-editor.component.html',
  styleUrl: './markdown-editor.component.scss',
})
export class MarkdownEditorComponent implements AfterViewInit {
  data = model<string>('');
  additionalInfo = input<TemplateRef<unknown>>();
  protected editorElement =
    viewChild.required<ElementRef<HTMLDivElement>>('editorElem');
  protected additionalElement =
    viewChild.required<ElementRef<HTMLSpanElement>>('additionalContent');
  private group1 = viewChild.required<TemplateRef<unknown>>('group1');
  private group2 = viewChild.required<TemplateRef<unknown>>('group2');
  private group3 = viewChild.required<TemplateRef<unknown>>('group3');
  private group5 = viewChild.required<TemplateRef<unknown>>('group5');
  protected editor: Editor;
  protected toolbarState = signal<
    Record<string, { active: boolean; disabled: boolean }>
  >({});
  protected readonly i18n = i18n;
  private isMobile = computed(() => windowWatcher.windowState() === 'compact');
  private editType = signal<EditorType>('wysiwyg');
  private renderer = inject(Renderer2);
  private injector = inject(Injector);
  private viewContainerRef = inject(ViewContainerRef);

  ngAfterViewInit(): void {
    const container = this.editorElement().nativeElement;
    // fired when language or mobile is changed
    effect(
      (onCleanup) => {
        const lang = language();
        let initialValue: string;
        let initialEditType: EditorType;
        untracked(() => {
          initialValue = this.data();
          initialEditType = this.editType();
        });
        this.editor = Editor.factory({
          el: container,
          initialEditType,
          previewStyle: this.isMobile() ? 'tab' : 'vertical',
          usageStatistics: false,
          language: lang,
          theme: 'fragjetzt',
          plugins: MD_PLUGINS,
          initialValue,
          customHTMLRenderer: MD_CUSTOM_TEXT_RENDERER,
          toolbarItems: this.createToolbar(),
        }) as Editor;

        const e = this.editor;
        e.on('change', () => this.data.set(e.getMarkdown()));
        e.on('changeMode', (mode) => this.editType.set(mode));
        e.on('changeToolbarState', ({ toolbarState }) => {
          this.toolbarState.set(toolbarState);
          console.log(toolbarState);
        });
        console.log(e);
        const observer = this.addRipples(container);
        this.addAdditionalContainer(container);

        onCleanup(() => {
          this.editor.destroy();
          observer.disconnect();
        });
      },
      { injector: this.injector },
    );
  }

  private createToolbar(): (string | ToolbarItemOptions)[][] {
    const getGroup = (ref: TemplateRef<unknown>) =>
      this.viewContainerRef
        .createEmbeddedView(ref)
        .rootNodes.filter(
          (e) => e instanceof HTMLButtonElement,
        ) as HTMLButtonElement[];
    const group1Buttons = getGroup(this.group1());
    const group2Buttons = getGroup(this.group2());
    const group3Buttons = getGroup(this.group3());
    const group5Buttons = getGroup(this.group5());
    return [
      [
        {
          el: group1Buttons[0],
          name: 'heading-override',
        },
        {
          el: group1Buttons[1],
          name: 'bold-override',
        },
        {
          el: group1Buttons[2],
          name: 'italic-override',
        },
        {
          el: group1Buttons[3],
          name: 'strike-override',
        },
      ],
      [
        {
          el: group2Buttons[0],
          name: 'hr-override',
        },
        {
          el: group2Buttons[1],
          name: 'hr-override',
        },
      ],
      [
        {
          el: group3Buttons[0],
          name: 'ul-override',
        },
        {
          el: group3Buttons[1],
          name: 'ol-override',
        },
        {
          el: group3Buttons[2],
          name: 'task-override',
        },
        {
          el: group3Buttons[3],
          name: 'indent-override',
        },
        {
          el: group3Buttons[4],
          name: 'outdent-override',
        },
      ],
      ['table', 'image', 'link'],
      [
        {
          el: group5Buttons[0],
          name: 'code-override',
        },
        {
          el: group5Buttons[1],
          name: 'codeblock-override',
        },
      ],
    ];
  }

  private addAdditionalContainer(container: HTMLDivElement) {
    const div = container.querySelector(
      'div.toastui-editor-defaultUI > .toastui-editor-mode-switch',
    );
    div.before(this.additionalElement().nativeElement);
  }

  private addRipples(container: HTMLDivElement): MutationObserver {
    // add ripples
    container
      .querySelectorAll(
        '.toastui-editor-mode-switch > .tab-item, .toastui-editor-tabs > .tab-item',
      )
      .forEach((e) => this.addRippleEvents(e as HTMLElement));
    const popup = container.querySelector('.toastui-editor-popup-body');
    const contextMenu = container.querySelector('.toastui-editor-context-menu');
    const observer = new MutationObserver((r) => {
      for (const entry of r) {
        entry.addedNodes.forEach((n) => {
          if (n instanceof HTMLElement) {
            n.querySelectorAll(
              'button, .menu-item, .tab-item, li[aria-role="menuitem"]',
            ).forEach((e) => {
              const button = e as HTMLButtonElement;
              this.addRippleEvents(button);
            });
          }
        });
      }
    });
    observer.observe(popup, {
      childList: true,
    });
    observer.observe(contextMenu, {
      childList: true,
    });
    return observer;
  }

  private addRippleEvents(element: HTMLElement) {
    const generateElement = (
      posX: number,
      posY: number,
      width: number,
      height: number,
    ) => {
      if (element.classList.contains('disabled')) {
        return;
      }
      const elem = this.renderer.createElement('div');
      this.renderer.addClass(elem, 'mat-ripple-element');
      const xDiff = Math.abs(posX - width / 2) + width / 2;
      const yDiff = Math.abs(posY - height / 2) + height / 2;
      const size = Math.sqrt(xDiff ** 2 + yDiff ** 2) * 2;
      this.renderer.setStyle(elem, 'height', size + 'px');
      this.renderer.setStyle(elem, 'width', size + 'px');
      const left = posX - size / 2 + 'px';
      const top = posY - size / 2 + 'px';
      this.renderer.setStyle(elem, 'left', left);
      this.renderer.setStyle(elem, 'top', top);
      this.renderer.appendChild(element, elem);
      setTimeout(() => this.injectRipple(elem));
      return elem;
    };
    element.addEventListener('mousedown', (e) => {
      const rect = element.getBoundingClientRect();
      e.detail;
      const ripple = generateElement(
        e.clientX - rect.x,
        e.clientY - rect.y,
        rect.width,
        rect.height,
      );
      element.addEventListener('mouseup', () => this.fadeOutRipple(ripple), {
        once: true,
      });
      element.addEventListener('mouseout', () => this.fadeOutRipple(ripple), {
        once: true,
      });
    });
    const map = new Map();
    element.addEventListener('touchstart', (e) => {
      const rect = element.getBoundingClientRect();
      for (const touch of Array.from(e.changedTouches)) {
        const ripple = generateElement(
          touch.clientX - rect.x,
          touch.clientY - rect.y,
          rect.width,
          rect.height,
        );
        map.set(touch.identifier, ripple);
      }
    });
    const onRemove = (e: TouchEvent) => {
      for (const touch of Array.from(e.changedTouches)) {
        const ripple = map.get(touch.identifier);
        if (ripple === undefined) {
          continue;
        }
        map.delete(touch.identifier);
        this.fadeOutRipple(ripple);
      }
    };
    element.addEventListener('touchcancel', (e) => onRemove(e));
    element.addEventListener('touchend', (e) => onRemove(e));
  }

  private injectRipple(ripple: HTMLDivElement) {
    this.renderer.setStyle(ripple, 'transition-duration', '225ms');
    this.renderer.setStyle(ripple, 'transform', 'scale3d(1, 1, 1)');
    ripple.addEventListener('transitioncancel', () => ripple.remove(), {
      once: true,
    });
  }

  private fadeOutRipple(ripple: HTMLDivElement) {
    this.renderer.setStyle(ripple, 'transition-duration', '150ms');
    this.renderer.setStyle(ripple, 'opacity', '0');
    ripple.addEventListener('transitionend', () => ripple.remove(), {
      once: true,
    });
  }
}
