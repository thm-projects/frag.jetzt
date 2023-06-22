import { TranslateService } from '@ngx-translate/core';
import { DsgvoBuilder, DsgvoSource } from '../../utils/dsgvo-builder';
import { AppComponent } from 'app/app.component';
import { Renderer2 } from '@angular/core';

const ATTRIBUTES = ['height', 'width'];

export class DsgvoVideo {
  static blotName = 'dsgvo-video';
  static className = 'ql-dsgvo-video';
  static tagName = 'div';
  static translator: TranslateService;
  domNode: HTMLVideoElement;

  static create(value) {
    const node = null;
    const sanitized = this.sanitize(value);
    const [source, url] = DsgvoBuilder.classifyURL(sanitized);
    node.dataset.src = url;
    const messageId = DsgvoBuilder.getMessageFromSource(source);
    const renderer2 = AppComponent.instance.injector.get(Renderer2);
    if (!messageId) {
      node.append(DsgvoBuilder.buildIframe(renderer2, url));
    } else {
      const article = DsgvoBuilder.buildArticle(
        '200px',
        url,
        messageId,
        this.translator,
        () => {
          if (source === DsgvoSource.ExternalUntrusted) {
            if (globalThis['window']) {
              window.open(url, '_blank').focus();
            }
            return;
          }
          node.replaceChild(DsgvoBuilder.buildIframe(renderer2, url), article);
          const width = parseFloat(
            getComputedStyle(node.firstElementChild).width,
          );
          (node.firstElementChild as HTMLElement).style.height =
            (width * 9) / 16 + 'px';
        },
        source !== DsgvoSource.ExternalUntrusted,
      );
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
    return url;
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
      return;
    }
  }

  html() {
    const video = '';
    return `<a href="${video}">${video}</a>`;
  }
}
