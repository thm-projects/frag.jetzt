import {
  AfterViewInit,
  Component,
  ElementRef,
  Injector,
  Renderer2,
  TemplateRef,
  effect,
  inject,
  input,
  model,
  untracked,
  viewChild,
} from '@angular/core';
import Editor, { EditorCore, Viewer } from '@toast-ui/editor';
import {
  MD_CUSTOM_TEXT_RENDERER,
  MD_PLUGINS,
} from '../markdown-common/plugins';
import { DSGVOService } from 'app/services/util/dsgvo.service';
import { AppStateService } from 'app/services/state/app-state.service';
import { DeviceStateService } from 'app/services/state/device-state.service';

@Component({
  selector: 'app-markdown-editor',
  templateUrl: './markdown-editor.component.html',
  styleUrl: './markdown-editor.component.scss',
})
export class MarkdownEditorComponent implements AfterViewInit {
  data = model<string>('');
  additionalInfo = input<TemplateRef<unknown>>();
  protected editorElement =
    viewChild.required<ElementRef<HTMLDivElement>>('editor');
  protected additionalElement =
    viewChild.required<ElementRef<HTMLSpanElement>>('additionalContent');
  private editor: EditorCore | Viewer;
  private renderer = inject(Renderer2);
  private injector = inject(Injector);
  private appState = inject(AppStateService);
  private deviceState = inject(DeviceStateService);

  constructor() {
    // inject dsgvo service for media
    inject(DSGVOService);
  }

  ngAfterViewInit(): void {
    const container = this.editorElement().nativeElement;
    // TODO: Signal
    const language = this.appState.getCurrentLanguage();
    // TODO: Signal
    const isMobile = this.deviceState.isMobile();
    // fired when language or mobile is changed
    effect(
      (onCleanup) => {
        let initialValue: string;
        untracked(() => {
          initialValue = this.data();
        });
        this.editor = Editor.factory({
          el: container,
          initialEditType: 'wysiwyg',
          previewStyle: isMobile ? 'tab' : 'vertical',
          usageStatistics: false,
          language,
          theme: 'fragjetzt',
          plugins: MD_PLUGINS,
          initialValue,
          customHTMLRenderer: MD_CUSTOM_TEXT_RENDERER,
        });

        const e = this.editor as Editor;
        e.on('change', () => this.data.set(e.getMarkdown()));
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
        '.toastui-editor-mode-switch > .tab-item, .toastui-editor-toolbar-icons, .toastui-editor-tabs > .tab-item',
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
