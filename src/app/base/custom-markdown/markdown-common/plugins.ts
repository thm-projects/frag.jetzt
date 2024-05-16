import chartPlugin, {
  PluginOptions as ChartOptions,
} from '@toast-ui/editor-plugin-chart';
import codeSyntaxHighlightPlugin from '@toast-ui/editor-plugin-code-syntax-highlight/dist/toastui-editor-plugin-code-syntax-highlight-all.js';
import colorPlugin, {
  PluginOptions as ColorOptions,
} from '@toast-ui/editor-plugin-color-syntax';
import tableMergedCellPlugin from '@toast-ui/editor-plugin-table-merged-cell';
import umlPlugin, {
  PluginOptions as UmlOptions,
} from '@toast-ui/editor-plugin-uml';
import {
  CustomHTMLRenderer,
  EditorPlugin,
} from '@toast-ui/editor/types/editor';
import {
  PluginOptions as KatexOptions,
  generateId,
  katexPlugin,
  renderKatex,
} from './katex-plugin';
import { dsgvoMediaPlugin } from './dsgvo-media-plugin';
import { HTMLToken } from '@toast-ui/editor/types/toastmark';

export const MD_EXAMPLE = `
# h1
## h2
### h3
#### h4
##### h5
###### h6

***

$$dsgvoMedia
https://youtu.be/de8UG1oeH30
$$

$$katex
  \\int_{0}^{\\infty} x^{\\alpha-1} e^{-\\beta x} \\, dx = \\frac{\\Gamma(\\alpha)}{\\beta^\\alpha} + \\sum_{n=1}^{\\infty} \\frac{(-1)^n}{n!} \\left( \\frac{\\beta}{\\gamma} \\right)^{n \\alpha} \\int_{0}^{1} t^{n \\alpha - 1} (1-t)^{\\alpha-1} \\, dt
$$

 Hier ein Test für inline-katex $c = \\pm\\sqrt{a^2 + b^2}$

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


![Test](https://blog.frag.jetzt/wp-content/themes/arsnova/img/arsnova-logo.png)

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

\`\`\`javascript
function test() {
  let a = 1;
  console.log(a);
}
\`\`\`

| Header 1 | Header 2 | Header 3 | Header 4 | Header 5 |
| -------- | -------- | -------- | -------- | -------- |
| D1 | D2 | D3 | D4 | D5 |
| D6 | @rows=2:@cols=2:D7, D8, D12, D13 | D9 | D10 |
| D11 | D14 | D15 |
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
      rendererURL: 'https://projects.thm.de/plantuml/svg/',
    } satisfies UmlOptions,
  ],
  // katex plugin
  [katexPlugin, { output: 'mathml', displayMode: true } satisfies KatexOptions],
  // Dsgvo Media
  dsgvoMediaPlugin,
];

export const MD_CUSTOM_TEXT_RENDERER: CustomHTMLRenderer = {
  text(node) {
    const katexRegex = /\$([^$]+)\$/gm;
    let m: RegExpExecArray;
    let lastIndex = 0;
    const returnArr: HTMLToken[] = [];
    const toRender: [string, string][] = [];
    const text = node.literal;
    while ((m = katexRegex.exec(text)) !== null) {
      if (m.index > lastIndex) {
        returnArr.push({
          type: 'text',
          content: text.substring(lastIndex, m.index),
        });
      }
      const id = generateId();
      returnArr.push(
        {
          type: 'openTag',
          tagName: 'span',
          attributes: {
            'data-katex-id': id,
          },
        },
        {
          type: 'closeTag',
          tagName: 'span',
        },
      );
      toRender.push([id, m[1]]);
      lastIndex = katexRegex.lastIndex;
    }
    if (lastIndex < text.length) {
      returnArr.push({
        type: 'text',
        content: text.substring(lastIndex),
      });
    }
    setTimeout(() => {
      for (const [id, text] of toRender) {
        renderKatex(id, text, {
          displayMode: false,
          output: 'mathml',
        });
      }
    });
    return returnArr;
  },
};
