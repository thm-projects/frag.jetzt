import { Injector } from '@angular/core';
import { ReplaySubject } from 'rxjs';
import { GdprBuilder } from './gdpr-builder';
import { GdprSource } from './gdpr-types';

enum URLType {
  NORMAL,
  YOUTUBE,
  VIMEO,
}

enum SubmitState {
  PENDING,
  SUCCESS,
}

class GdprWatcher {
  private readonly allowedURLs = new Map<string, SubmitState>();
  private readonly externalTrusted = new Set<string>([
    // Audio podcasts
  ]);
  private readonly trustedURLs = new Set<string>([
    location.origin.toLowerCase(),
  ]);
  private readonly builder = new ReplaySubject<GdprBuilder>(1);
  private readonly observer = new MutationObserver((mutations) =>
    this.onMutate(mutations),
  );

  constructor() {
    this.observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['src'],
      attributeOldValue: true,
    });
  }

  trustUrl(url: string) {
    this.allowedURLs.set(url, SubmitState.SUCCESS);
  }

  getVideoUrl(url: string): [string, URLType] {
    let match =
      url.match(
        /^(?:(https?):\/\/)?(?:(?:www|m)\.)?youtube\.com\/watch.*v=([a-zA-Z0-9_-]+)/,
      ) ||
      url.match(
        /^(?:(https?):\/\/)?(?:(?:www|m)\.)?youtu\.be\/([a-zA-Z0-9_-]+)/,
      ) ||
      url.match(/^.*(youtu.be\/|v\/|e\/|u\/\w+\/|embed\/|v=)([^#&?]*).*/) ||
      url.match(
        /^(?:(https?):\/\/)?www\.youtube-nocookie\.com\/embed\/([a-zA-Z0-9_-]+)/,
      );
    if (match && match[2].length === 11) {
      return [
        'https://www.youtube-nocookie.com/embed/' + match[2],
        URLType.YOUTUBE,
      ];
    }
    match = url.match(
      /^(?:(https?):\/\/)?(?:(?:www|player)\.)?vimeo\.com\/(\d+)/,
    );
    if (match) {
      return [
        (match[1] || 'https') + '://player.vimeo.com/video/' + match[2] + '/',
        URLType.VIMEO,
      ];
    }
    return [url, URLType.NORMAL];
  }

  classifyURL(srcURL: string): [type: GdprSource, url: string] {
    const lowercaseSrc = this.verifyURL(srcURL);
    if (!this.isProtocolHTTP(lowercaseSrc)) {
      return [GdprSource.Unknown, srcURL];
    }
    let isTrusted = false;
    for (const key of this.trustedURLs) {
      if (lowercaseSrc.startsWith(key)) {
        isTrusted = true;
        break;
      }
    }
    if (isTrusted) {
      return [GdprSource.Trusted, srcURL];
    }
    const [url, type] = this.getVideoUrl(srcURL);
    if (type === URLType.YOUTUBE) {
      return [GdprSource.YouTube, url];
    } else if (type === URLType.VIMEO) {
      return [GdprSource.Vimeo, url];
    } else if (this.externalTrusted.has(lowercaseSrc)) {
      return [GdprSource.External, srcURL];
    } else {
      return [GdprSource.ExternalUntrusted, srcURL];
    }
  }

  init(injector: Injector) {
    this.builder.next(new GdprBuilder(injector));
    this.builder.complete();
  }

  private onMutate(mutations: MutationRecord[]) {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        Array.from(mutation.addedNodes).forEach((node) => {
          if (!(node instanceof HTMLElement)) {
            return;
          }
          if (node instanceof HTMLIFrameElement) {
            this.checkIframe(node);
            return;
          }
          node.querySelectorAll('iframe').forEach((elem) => {
            this.checkIframe(elem);
          });
        });
      } else if (mutation.type === 'attributes') {
        if (
          mutation.target instanceof HTMLIFrameElement &&
          mutation.attributeName === 'src' &&
          mutation.oldValue !== mutation.target.src
        ) {
          this.checkIframe(mutation.target);
        }
      }
    }
  }

  private checkIframe(iframe: HTMLIFrameElement) {
    if (!iframe.parentNode) {
      return;
    }
    let state = this.allowedURLs.get(iframe.src);
    if (state === SubmitState.SUCCESS) {
      return;
    }
    const computed = getComputedStyle(iframe);
    const [source, url] = this.classifyURL(iframe.src);
    iframe.src = url;
    state = this.allowedURLs.get(url);
    if (state === SubmitState.SUCCESS || source === GdprSource.Trusted) {
      return;
    }
    iframe['stop']?.();
    const dummy = document.createElement('span');
    iframe.parentNode.replaceChild(dummy, iframe);
    this.builder.subscribe((builder) =>
      builder.createNotice(iframe, dummy, source, url, computed, () => {
        this.allowedURLs.set(iframe.src, SubmitState.SUCCESS);
      }),
    );
  }

  private isProtocolHTTP(url: string) {
    return url.startsWith('http://') || url.startsWith('https://');
  }

  private verifyURL(url: string) {
    url = url.toLowerCase();
    if (!url.endsWith('/')) {
      url += '/';
    }
    return url;
  }
}

export const gdprWatcher = new GdprWatcher();
