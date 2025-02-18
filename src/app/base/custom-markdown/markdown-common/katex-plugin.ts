import { PluginContext, PluginInfo, MdNode } from '@toast-ui/editor';
import katex, { KatexOptions } from 'katex';

type func = (...args: unknown[]) => unknown;

// https://katex.org/docs/options
export interface PluginOptions {
  displayMode?: boolean; // default (false)
  output?: 'html' | 'mathml' | 'htmlAndMathml'; // default (htmlAndMathml)
  leqno?: boolean; // default (false)
  fleqn?: boolean; // default (false)
  throwOnError?: boolean; // default (true)
  errorColor?: string; // default (#cc0000)
  macros?: object; // default ?
  minRuleThickness?: number; // default (0.04)
  colorIsTextColor?: boolean; // default (false)
  maxSize?: number; // default (Infinity)
  maxExpand?: number; // default (1000)
  strict?: boolean | string | func; // default ("warn")
  trust?: boolean | func; // default (false)
  globalGroup?: boolean; // default (false)
}

export const generateId = () =>
  `katex-${Math.random().toString(36).substring(2, 12)}`;

export const renderKatex = (
  id: string,
  text: string,
  options: KatexOptions,
) => {
  const container = document.querySelector(
    `[data-katex-id=${id}]`,
  ) as HTMLDivElement;
  if (!container) {
    return;
  }
  try {
    katex.render(text, container, options);
  } catch (e) {
    if (typeof e !== 'object') {
      container.innerText = `${e}`;
      return;
    }
    const errorContainer = document.createElement('span');
    errorContainer.classList.add('katex-error');
    const span = document.createElement('span');
    span.innerText = `${e.name}: Position ${e.position}, Length: ${e.length}`;
    errorContainer.append(span);
    const detail = document.createElement('span');
    detail.innerText = e.rawMessage;
    errorContainer.append(detail);
    container.append(errorContainer);
  }
};

export const katexPlugin = (
  context: PluginContext,
  options: KatexOptions,
): PluginInfo => {
  let timer = null;
  return {
    toHTMLRenderers: {
      katex(node: MdNode) {
        const id = generateId();

        if (timer) {
          //clearTimeout(timer);
        }

        timer = setTimeout(() => renderKatex(id, node.literal, options));

        return [
          {
            type: 'openTag',
            tagName: 'div',
            classNames: ['katex-block'],
            attributes: { 'data-katex-id': id },
            outerNewLine: true,
          },
          { type: 'closeTag', tagName: 'div', outerNewLine: true },
        ];
      },
    },
  };
};
