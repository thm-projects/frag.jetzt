import Quill from 'quill';
import { TranslateService } from '@ngx-translate/core';
import { DsgvoBuilder } from '../../utils/dsgvo-builder';

const BlockEmbed = Quill.import('blots/block/embed');
const Link = Quill.import('formats/link');

const ATTRIBUTES = ['height', 'width'];

export class DsgvoVideo extends BlockEmbed {
  static blotName = 'dsgvo-video';
  static className = 'ql-dsgvo-video';
  static tagName = 'div';
  static translator: TranslateService;
  domNode: HTMLVideoElement;

  static create(value) {
    const node = super.create(value) as HTMLElement;
    const sanitized = this.sanitize(value);
    const [source, url] = DsgvoBuilder.classifyURL(sanitized);
    node.dataset.src = url;
    const messageId = DsgvoBuilder.getMessageFromSource(source);
    if (!messageId) {
      node.append(DsgvoBuilder.buildIframe(url));
    } else {
      const article = DsgvoBuilder.buildArticle('200px', url, messageId, this.translator, () => {
        node.replaceChild(DsgvoBuilder.buildIframe(url), article);
        const width = parseFloat(getComputedStyle(node.firstElementChild).width);
        (node.firstElementChild as HTMLElement).style.height = (width * 9 / 16) + 'px';
      });
      node.append(article);
    }
    return node;
  }

  static formats(domNode: HTMLElement) {
    return ATTRIBUTES.reduce((formats, attribute) => {
      if (domNode.dataset[attribute]) {
        formats[attribute] = domNode.dataset[attribute];
      }
      return formats;
    }, {});
  }

  static sanitize(url: string) {
    return Link.sanitize(url);
  }

  static value(domNode: HTMLElement) {
    return domNode.dataset.src;
  }

  format(name, value) {
    if (ATTRIBUTES.indexOf(name) > -1) {
      this.domNode.dataset[name] = value;
      if (value) {
        this.domNode.firstElementChild.setAttribute(name, value);
      } else {
        this.domNode.firstElementChild.removeAttribute(name);
      }
    } else {
      super.format(name, value);
    }
  }

  html() {
    const { video } = super.value();
    return `<a href="${video}">${video}</a>`;
  }
}
