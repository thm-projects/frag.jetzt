import chartPlugin, {
  PluginOptions as ChartOptions,
} from '@toast-ui/editor-plugin-chart';
import codeSyntaxHighlightPlugin from '@toast-ui/editor-plugin-code-syntax-highlight';
import colorPlugin, {
  PluginOptions as ColorOptions,
} from '@toast-ui/editor-plugin-color-syntax';
import tableMergedCellPlugin from '@toast-ui/editor-plugin-table-merged-cell';
import umlPlugin, {
  PluginOptions as UmlOptions,
} from '@toast-ui/editor-plugin-uml';
import { EditorPlugin } from '@toast-ui/editor/types/editor';
// Import languages
import '@toast-ui/editor/dist/i18n/de-de';
import { PluginOptions as KatexOptions, katexPlugin } from './katex-plugin';
import { dsgvoMediaPlugin } from './dsgvo-media-plugin';

export const MD_EXAMPLE = `
# h1
## h2
### h3
#### h4
##### h5
###### h6

***

$$dsgvoMedia
https://www.wacon.de/typo3-know-how/youtube-ohne-cookies-einbinden.html
$$

$$katex
c = \\pm\\sqrt{a^2 + b^2}
$$

$$uml
partition Conductor {
  (*) --> "Climbs on Platform"
  --> === S1 ===
  --> Bows
}

partition Audience #LightSkyBlue {
  === S1 === --> Applauds
}

partition Conductor {
  Bows --> === S2 ===
  --> WavesArmes
  Applauds --> === S2 ===
}

partition Orchestra #CCCCEE {
  WavesArmes --> Introduction
  --> "Play music"
}
$$

$$chart
,category1,category2
Jan,21,23
Feb,31,17

type: column
title: Monthly Revenue
x.title: Amount
y.title: Month
y.min: 1
y.max: 40
y.suffix: $
$$

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
`;

export const MD_PLUGINS: EditorPlugin[] = [
  // chart plugin
  [
    chartPlugin,
    {
      width: 'auto',
      height: 'auto',
      minWidth: 0,
      minHeight: 0,
      maxWidth: Infinity,
      maxHeight: Infinity,
    } satisfies ChartOptions,
  ],
  // code syntax highlighting (has config, but would be overriden)
  codeSyntaxHighlightPlugin,
  // color text
  [colorPlugin, {} satisfies ColorOptions],
  // table merge (no config)
  tableMergedCellPlugin,
  // uml plugin
  [
    umlPlugin,
    {
      rendererURL: 'http://www.plantuml.com/plantuml/svg/',
      // Could also be: https://projects.thm.de/plantuml/png/
    } satisfies UmlOptions,
  ],
  // katex plugin
  [katexPlugin, { output: 'mathml', displayMode: true } satisfies KatexOptions],
  // Dsgvo Media
  dsgvoMediaPlugin,
];
