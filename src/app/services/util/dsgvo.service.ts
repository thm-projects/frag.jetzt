import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { QuillUtils, URLType } from '../../utils/quill-utils';

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

  onMutate(mutations: MutationRecord[]) {
    mutations.forEach(mutation => {
      if (mutation.type === 'childList') {
        Array.from(mutation.addedNodes).forEach(node => {
          if (!(node instanceof HTMLElement)) {
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
    const lowercasedSrc = elem.src.toLowerCase();
    if (!lowercasedSrc.startsWith('http://') && !lowercasedSrc.startsWith('https://')) {
      this.createMessage('dsgvo.unknown-source', elem.src, elem);
      return;
    }
    if (lowercasedSrc.startsWith(location.origin.toLowerCase())) {
      // Same origin, no CORS
      return;
    }
    const [url, type] = QuillUtils.getVideoUrl(elem.src);
    if (type === URLType.YOUTUBE) {
      this.createMessage('dsgvo.youtube-video', url, elem);
    } else if (type === URLType.VIMEO) {
      this.createMessage('dsgvo.vimeo-video', url, elem);
    } else {
      this.createMessage('dsgvo.external-source', url, elem);
    }
  }

  private createMessage(messageId: string, url: string, iframe: HTMLIFrameElement) {
    if (!iframe.parentNode) {
      return;
    }
    iframe['stop']?.();
    const computed = window.getComputedStyle(iframe);
    const newElem = document.createElement('article');
    newElem.classList.add('dsgvo-info-article');
    newElem.style.minHeight = computed.height;
    const header = document.createElement('h3');
    const p = document.createElement('p');
    const button = document.createElement('button');
    button.classList.add('mat-flat-button', 'mat-button-base');
    button.addEventListener('click', () => {
      newElem.parentElement.classList.toggle('dsgvo-inside', false);
      newElem.parentNode.replaceChild(iframe, newElem);
    }, { once: true });
    newElem.append(header, p, button);
    iframe.parentElement.classList.toggle('dsgvo-inside', true);
    iframe.parentNode.replaceChild(newElem, iframe);
    iframe.src = url;
    const title = messageId + '-title';
    const btnTitle = messageId + '-button-text';
    this.translateService.get([messageId, title, btnTitle], { url }).subscribe((trans) => {
      p.innerHTML = trans[messageId];
      header.innerText = trans[title];
      button.innerText = trans[btnTitle];
    });
  }

}
