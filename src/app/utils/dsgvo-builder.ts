import { TranslateService } from '@ngx-translate/core';
import { QuillUtils, URLType } from './quill-utils';

export enum DsgvoSource {
  Unknown,
  FromOrigin,
  YouTube,
  Vimeo,
  External,
}

export class DsgvoBuilder {
  static buildArticle(
    height: string,
    url: string,
    messageId: string,
    translator: TranslateService,
    action: () => void,
  ) {
    const article = document.createElement('article');
    article.classList.add('dsgvo-info-article');
    article.style.minHeight = height;
    const header = document.createElement('h3');
    const p = document.createElement('p');
    const button = document.createElement('button');
    button.classList.add('mat-flat-button', 'mat-button-base');
    button.addEventListener('click', e => {
      e.preventDefault();
      e.stopImmediatePropagation();
      action();
    }, { once: true });
    article.append(header, p, button);
    const title = messageId + '-title';
    const btnTitle = messageId + '-button-text';
    translator.get([messageId, title, btnTitle], { url }).subscribe((trans) => {
      p.innerHTML = trans[messageId];
      header.innerText = trans[title];
      button.innerText = trans[btnTitle];
    });
    return article;
  }

  static buildIframe(src: string) {
    const frame = document.createElement('iframe');
    frame.classList.add('ql-video');
    frame.setAttribute('frameborder', '0');
    frame.setAttribute('allowfullscreen', 'true');
    frame.setAttribute('src', src);
    return frame;
  }

  static getMessageFromSource(source: DsgvoSource): string {
    switch (source) {
      case DsgvoSource.Unknown:
        return 'dsgvo.unknown-source';
      case DsgvoSource.YouTube:
        return 'dsgvo.youtube-video';
      case DsgvoSource.Vimeo:
        return 'dsgvo.vimeo-video';
      case DsgvoSource.External:
        return 'dsgvo.external-source';
    }
    return null;
  }

  static classifyURL(srcURL: string): [type: DsgvoSource, url: string] {
    const lowercaseSrc = srcURL.toLowerCase();
    if (!lowercaseSrc.startsWith('http://') && !lowercaseSrc.startsWith('https://')) {
      return [DsgvoSource.Unknown, srcURL];
    }
    if (lowercaseSrc.startsWith(location.origin.toLowerCase())) {
      // Same origin, no CORS
      return [DsgvoSource.FromOrigin, srcURL];
    }
    const [url, type] = QuillUtils.getVideoUrl(srcURL);
    if (type === URLType.YOUTUBE) {
      return [DsgvoSource.YouTube, url];
    } else if (type === URLType.VIMEO) {
      return [DsgvoSource.Vimeo, url];
    } else {
      return [DsgvoSource.External, srcURL];
    }
  }
}
