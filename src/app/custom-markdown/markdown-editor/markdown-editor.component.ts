import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  Renderer2,
  ViewChild,
  inject,
} from '@angular/core';
import Editor, { EditorCore, Viewer } from '@toast-ui/editor';

@Component({
  selector: 'app-markdown-editor',
  templateUrl: './markdown-editor.component.html',
  styleUrl: './markdown-editor.component.scss',
})
export class MarkdownEditorComponent implements AfterViewInit, OnDestroy {
  @ViewChild('editor')
  protected editorElement: ElementRef<HTMLDivElement>;
  private editor: EditorCore | Viewer;
  private renderer = inject(Renderer2);
  private observer: MutationObserver;

  ngAfterViewInit(): void {
    const container = this.editorElement.nativeElement;
    this.editor = Editor.factory({
      el: container,
      initialEditType: 'markdown',
      previewStyle: 'vertical',
      usageStatistics: false,
      language: 'de',
      theme: 'fragjetzt',
      initialValue: `
      # h1
      ## h2
      ### h3
      #### h4
      ##### h5
      ###### h6

      ***

      ToastUI ist eine Sammlung von Open-Source-Tools für die Webentwicklung, die verschiedene Funktionen bietet, darunter ein WYSIWYG (What You See Is What You Get) Editor, der auch Markdown unterstützt. Der ToastUI Editor ermöglicht es Benutzern, Inhalte sowohl in einem visuellen Editor als auch direkt in Markdown zu erstellen und zu bearbeiten. Das Formatieren von Text in Markdown mit dem ToastUI Editor ist einfach und effizient, da es Benutzern ermöglicht, die Vorteile von Markdown zu nutzen, einschließlich der leichten Bearbeitung und der Möglichkeit, klaren, semantischen Text ohne die Notwendigkeit von HTML-Kenntnissen zu erstellen.

      Hier sind einige grundlegende Markdown-Formatierungen, die mit ToastUI verwendet werden können:

      - **Fett** Text: \`**Fett**\` oder \`__Fett__\`
      - *Kursiv* Text: \`*Kursiv*\` oder \`_Kursiv_\`
      - Kombinierte **_Fett und Kursiv_**: \`**_Fett und Kursiv_**\`
      - \`Code\` Inline: \`\` \`Code\` \`\`
      - [Link](http://example.com): \`[Link](http://example.com)\`
      - Bilder: \`![Alt-Text](url.jpg "Titel")\`
      - Ungeordnete Listen: \`- Liste\` oder \`* Liste\`
      - Geordnete Listen: \`1. Erster Punkt\`
      - Zitate: \`> Zitat\`
      - Horizontale Linie: \`---\`

      1. Aufgabe 1
          1. Aufgabe 1.1
          2. Aufgabe 1.2
          3. Aufgabe 1.3
      2. Aufgabe 2
      3. Aufgabe 3
      4. Aufgabe 4
      5. Aufgabe 5
      6. Aufgabe 6
      7. Aufgabe 7
      8. Aufgabe 8

      * [ ] Aufgabe 1
      * [x] Aufgabe 2
      * [ ] Aufgabe 3
      * [x] Aufgabe 4
      * [ ] Aufgabe 5
      * [x] Aufgabe 6
      * [ ] Aufgabe 7
      * [x] Aufgabe 8

      > Dies ist ein Test.
      > Mit mehreren Zeilen.


          Zeile 1
          Zeile 2


      ![Test](https://png.pngtree.com/png-vector/20191126/ourmid/pngtree-image-of-cute-radish-vector-or-color-illustration-png-image_2040180.jpg)

      Hier ist ein einfaches Beispiel, wie man einen Text in Markdown mit ToastUI formatieren könnte:

      \`\`\`markdown
      # Überschrift 1

      ## Überschrift 2

      **Fettgedruckter Text** und *kursiver Text*.

      - Liste
        - Unterliste
          - Unter-Unterliste

      1. Erster Punkt
         1. Unterpunkt

      > Das ist ein Zitat.

      \`Code\`

      [OpenAI](https://www.openai.com)

      ![Bild](https://example.com/bild.jpg "Bildtitel")
      \`\`\`

      Dieser Code erzeugt eine strukturierte Dokumentation mit Überschriften, Fett- und Kursivschrift, Listen, Zitaten, Code-Blöcken, Links und Bildern, alles in einem sauberen Format, das leicht zu lesen und zu verstehen ist.

      \`\`\`JavaScript
      function test() {
        let a = 1;
        console.log(a);
      }
      \`\`\`

      | Header 1 | Header 2 | Header 3 | Header 4 | Header 5 |
      | -------- | -------- | -------- | -------- | -------- |
      | D1 | D2 | D3 | D4 | D5 |
      | D6 | D7 | D8 | D9 | D10 |
      | D11 | D12 | D13 | D14 | D15 |
      | D16 | D17 | D18 | D19 | D20 |
      `.replace(/^ {6}/gm, ''),
    });
    // add ripples
    container
      .querySelectorAll(
        '.toastui-editor-mode-switch > .tab-item, .toastui-editor-toolbar-icons, .toastui-editor-tabs > .tab-item',
      )
      .forEach((e) => this.addRippleEvents(e as HTMLElement));
    const popup = container.querySelector('.toastui-editor-popup-body');
    const contextMenu = container.querySelector('.toastui-editor-context-menu');
    this.observer = new MutationObserver((r) => {
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
    this.observer.observe(popup, {
      childList: true,
    });
    this.observer.observe(contextMenu, {
      childList: true,
    });
  }

  ngOnDestroy(): void {
    this.observer.disconnect();
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
