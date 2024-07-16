import { MdNode } from '@toast-ui/editor';
import { Context, HTMLToken } from '@toast-ui/editor/types/toastmark';
import { generateId, renderKatex } from './katex-plugin';

const transformKatexLine = (text: string): HTMLToken[] => {
  const id = generateId();
  setTimeout(() => {
    renderKatex(id, text, {
      displayMode: true,
      output: 'mathml',
    });
  });
  return [
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
  ];
};

const transformInlineKatex = (node: MdNode) => {
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
};

interface ActionDelete {
  type: 'delete';
}

interface ActionKeep {
  type: 'keep';
}

interface ActionTransform {
  type: 'transform';
  transformed: HTMLToken[];
}

type Action = ActionDelete | ActionKeep | ActionTransform;

export class KatexDisplay {
  private readonly cache = new Map<MdNode, Action>();
  constructor() {}

  reset(): void {
    this.cache.clear();
  }

  nextText(node: MdNode): HTMLToken[] {
    // apply action if available
    const action = this.cache.get(node);
    if (action) {
      if (action.type === 'delete') {
        return null;
      } else if (action.type === 'keep') {
        return transformInlineKatex(node);
      }
      return action.transformed;
    }
    if (node.literal !== '[') {
      return transformInlineKatex(node);
    }
    // Search for end
    const end = this.findEnd(node);
    // no end found
    if (!end) {
      let it = node.next;
      while (it) {
        this.cache.set(it, { type: 'keep' });
        it = it.next;
      }
      return transformInlineKatex(node);
    }
    // end found
    return this.transformFromTo(node, end);
  }

  nextEmph(node: MdNode, context: Context): HTMLToken[] {
    const type = this.cache.get(node)?.type;
    if (type === 'delete') {
      return null;
    }
    return [{ type: context.entering ? 'openTag' : 'closeTag', tagName: 'em' }];
  }

  nextSoftbreak(node: MdNode): HTMLToken[] {
    const action = this.cache.get(node);
    if (action?.type === 'delete') {
      return null;
    }
    return [{ type: 'openTag', tagName: 'br' }];
  }

  private findEnd(node: MdNode): MdNode {
    let it = node.next;
    let end: MdNode = null;
    const stack: MdNode[] = [];
    while (it || (it = stack.pop())) {
      if (it.firstChild) {
        if (it.next) {
          stack.push(it.next);
        }
        it = it.firstChild;
        continue;
      }
      if (it.type === 'text' && it.literal === ']') {
        end = it;
        break;
      }
      it = it.next;
    }
    return end;
  }

  private transformFromTo(start: MdNode, end: MdNode): HTMLToken[] {
    // {'text', ']'}
    this.cache.set(end, { type: 'delete' });
    // line break after ']'
    if (end.next?.type === 'softbreak') {
      this.cache.set(end.next, { type: 'delete' });
    }
    // line break after '['
    let it = start.next;
    if (it.type === 'softbreak') {
      this.cache.set(start, { type: 'keep' });
      it = it.next;
    }
    const stack: (MdNode | string)[] = [];
    let toAdd = '';
    let lastTextNode = null;
    let lastType: MdNode['type'] = null;
    while (it !== end) {
      if (!it) {
        let popped = stack.pop();
        while (typeof popped === 'string') {
          toAdd += popped;
          popped = stack.pop();
        }
        it = popped;
      }
      if (!it) {
        console.error('No end found!');
        break;
      }
      if (it.firstChild) {
        if (it.type === 'emph' || it.type === 'strong') {
          this.cache.set(it, { type: 'delete' });
          const char = it.type === 'emph' ? '_' : '**';
          toAdd += char;
          stack.push(char);
        } else {
          console.warn('Unknown type:', it.type);
        }
        if (it.next) {
          stack.push(it.next);
        }
        lastType = it.type;
        it = it.firstChild;
        continue;
      }
      if (it.type !== 'text') {
        lastType = it.type;
        it = it.next;
        this.cache.set(it, { type: 'delete' });
        continue;
      }
      // text, text => text, text
      // text emph text emph text => text
      if (lastType === 'text') {
        this.cache.set(lastTextNode, {
          type: 'transform',
          transformed: transformKatexLine(toAdd),
        });
        toAdd = '';
      }
      lastTextNode = it;
      lastType = 'text';
      toAdd += it.literal;
      // if not later overriden, will be destroyed
      this.cache.set(it, { type: 'delete' });
      it = it.next;
    }
    if (toAdd) {
      this.cache.set(lastTextNode, {
        type: 'transform',
        transformed: transformKatexLine(toAdd),
      });
    }
    // delete {'text', '['}
    return null;
  }
}
