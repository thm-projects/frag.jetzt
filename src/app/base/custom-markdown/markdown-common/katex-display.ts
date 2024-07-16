import { MdNode } from '@toast-ui/editor';
import { HTMLToken } from '@toast-ui/editor/types/toastmark';
import { generateId, renderKatex } from './katex-plugin';

// TODO: Fix emph in Katex
const transformInlineKatex = (node: MdNode) => {
  const katexRegex = /\$[^$]+\$/gm;
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
    toRender.push([id, m[0].substring(1, m[0].length - 1)]);
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
};

export class KatexDisplay {
  constructor() {}

  nextText(node: MdNode): HTMLToken[] {
    return transformInlineKatex(node);
  }
}
