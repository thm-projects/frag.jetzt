import { TranslateService } from '@ngx-translate/core';
import { QuillUtils, URLType } from './quill-utils';
import { EventService } from 'app/services/util/event.service';

export enum DsgvoSource {
  Unknown,
  Trusted,
  YouTube,
  Vimeo,
  External,
  ExternalUntrusted,
}

const EXTERNAL_TRUSTED = new Set([
  // Audio podcasts
]);

export class DsgvoBuilder {
  private static _trustedURLs = new Set<string>([
    location.origin.toLowerCase(),
  ]);

  static trustURL(url: string) {
    url = this.verifyURL(url);
    if (!this.isProtocolHTTP(url)) {
      console.error('URL for trusting is not HTTP:', url);
      return;
    }
    this._trustedURLs.add(url);
  }

  static buildArticle(
    height: string,
    url: string,
    messageId: string,
    translator: TranslateService,
    action: () => void,
    isActionOnce = true,
  ) {
    const article = document.createElement('article');
    article.contentEditable = 'false';
    article.classList.add('dsgvo-info-article');
    article.style.minHeight = height;
    const header = document.createElement('h3');
    const p = document.createElement('p');
    const button = document.createElement('button');
    button.classList.add('mat-flat-button', 'mat-button-base');
    button.addEventListener(
      'click',
      (e) => {
        e.preventDefault();
        e.stopImmediatePropagation();
        EventService.instance.broadcast('dsgvo.accept', url);
        action();
      },
      { once: isActionOnce },
    );
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
      case DsgvoSource.ExternalUntrusted:
        return 'dsgvo.external-source-untrusted';
    }
    return null;
  }

  static classifyURL(srcURL: string): [type: DsgvoSource, url: string] {
    const lowercaseSrc = this.verifyURL(srcURL);
    if (!this.isProtocolHTTP(lowercaseSrc)) {
      return [DsgvoSource.Unknown, srcURL];
    }
    let isTrusted = false;
    for (const key of this._trustedURLs) {
      if (lowercaseSrc.startsWith(key)) {
        isTrusted = true;
        break;
      }
    }
    if (isTrusted) {
      return [DsgvoSource.Trusted, srcURL];
    }
    const [url, type] = QuillUtils.getVideoUrl(srcURL);
    if (type === URLType.YOUTUBE) {
      return [DsgvoSource.YouTube, url];
    } else if (type === URLType.VIMEO) {
      return [DsgvoSource.Vimeo, url];
    } else if (EXTERNAL_TRUSTED.has(lowercaseSrc)) {
      return [DsgvoSource.External, srcURL];
    } else {
      return [DsgvoSource.ExternalUntrusted, srcURL];
    }
  }

  private static isProtocolHTTP(url: string) {
    return url.startsWith('http://') || url.startsWith('https://');
  }

  private static verifyURL(url: string) {
    url = url.toLowerCase();
    if (!url.endsWith('/')) {
      url += '/';
    }
    return url;
  }
}
