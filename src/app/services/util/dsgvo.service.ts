import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DsgvoBuilder } from '../../utils/dsgvo-builder';

@Injectable({
  providedIn: 'root'
})
export class DSGVOService {

  private _observer: MutationObserver;

  constructor(
    private translateService: TranslateService,
  ) {
    this._observer = new MutationObserver(this.onMutate.bind(this));
    this._observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['src'],
      attributeOldValue: true,
    });
  }

  private onMutate(mutations: MutationRecord[]) {
    mutations.forEach(mutation => {
      if (mutation.type === 'childList') {
        Array.from(mutation.addedNodes).forEach(node => {
          if (!(node instanceof HTMLElement)) {
            return;
          }
          if (node instanceof HTMLIFrameElement) {
            this.checkIframe(node);
            return;
          }
          node.querySelectorAll('iframe').forEach(elem => {
            this.checkIframe(elem);
          });
        });
      } else if (mutation.type === 'attributes') {
        if (mutation.target instanceof HTMLIFrameElement && mutation.attributeName === 'src' &&
          mutation.oldValue !== mutation.target.src) {
          this.checkIframe(mutation.target);
        }
      }
    });
  }

  private checkIframe(elem: HTMLIFrameElement) {
    if (elem.dataset.verified === 'true' || !elem.parentNode) {
      return;
    }
    const parentClass = elem.parentElement.classList;
    if (parentClass.contains('ql-editor') || parentClass.contains('ql-dsgvo-video')) {
      // Fix issues with Quill
      return;
    }
    const [source, url] = DsgvoBuilder.classifyURL(elem.src);
    const messageId = DsgvoBuilder.getMessageFromSource(source);
    if (!messageId) {
      return;
    }
    this.createMessage(messageId, url, elem);
  }

  private createMessage(messageId: string, url: string, iframe: HTMLIFrameElement) {
    iframe['stop']?.();
    const computed = getComputedStyle(iframe);
    const newElem = DsgvoBuilder.buildArticle(computed.height, url, messageId, this.translateService, () => {
      iframe.dataset.verified = String(true);
      newElem.parentElement.classList.toggle('dsgvo-inside', false);
      newElem.parentNode.replaceChild(iframe, newElem);
    });
    iframe.parentElement.classList.toggle('dsgvo-inside', true);
    iframe.parentNode.replaceChild(newElem, iframe);
    iframe.src = url;
  }

}
