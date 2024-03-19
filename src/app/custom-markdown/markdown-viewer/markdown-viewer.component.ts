import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import Editor, { EditorCore, Viewer } from '@toast-ui/editor';

@Component({
  selector: 'app-markdown-viewer',
  templateUrl: './markdown-viewer.component.html',
  styleUrl: './markdown-viewer.component.scss',
})
export class MarkdownViewerComponent implements AfterViewInit {
  @ViewChild('editor')
  protected editorElement: ElementRef<HTMLDivElement>;
  private editor: EditorCore | Viewer;

  ngAfterViewInit(): void {
    const container = this.editorElement.nativeElement;
    this.editor = Editor.factory({
      el: container,
      usageStatistics: false,
      theme: 'fragjetzt',
      viewer: true,
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
  }
}
