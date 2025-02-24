import { PluginInfo, MdNode } from '@toast-ui/editor';

const generateId = () => `dsgvo-${Math.random().toString(36).substring(2, 12)}`;

const render = (id: string, text: string) => {
  const container = document.querySelector(
    `div[data-dsgvo-id=${id}]`,
  ) as HTMLDivElement;
  if (!container) {
    return;
  }
  const iframe = document.createElement('iframe');
  iframe.style.setProperty('border', 'none');
  iframe.style.setProperty('width', '100%');
  iframe.style.setProperty('aspect-ratio', '16 / 9');
  iframe.allowFullscreen = true;
  iframe.src = text.trim();
  container.append(iframe);
};

export const dsgvoMediaPlugin = (): PluginInfo => {
  let timer = null;
  return {
    toHTMLRenderers: {
      dsgvoMedia(node: MdNode) {
        const id = generateId();

        if (timer) {
          clearTimeout(timer);
        }

        timer = setTimeout(() => render(id, node.literal));

        return [
          {
            type: 'openTag',
            tagName: 'div',
            attributes: { 'data-dsgvo-id': id },
            outerNewLine: true,
          },
          { type: 'closeTag', tagName: 'div', outerNewLine: true },
        ];
      },
    },
  };
};
