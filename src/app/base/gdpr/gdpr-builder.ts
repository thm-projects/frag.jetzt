import { ApplicationRef, Injector, createComponent } from '@angular/core';
import { GdprNoticeComponent } from './gdpr-notice/gdpr-notice.component';
import { GdprSource } from './gdpr-types';

export class GdprBuilder {
  constructor(private injector: Injector) {}

  createNotice(
    iframe: HTMLIFrameElement,
    dummy: HTMLElement,
    source: GdprSource,
    url: string,
    style: CSSStyleDeclaration,
    onSubmit: () => void,
  ) {
    const appRef = this.injector.get(ApplicationRef);
    const ref = createComponent(GdprNoticeComponent, {
      environmentInjector: appRef.injector,
      hostElement: dummy,
    });
    ref.setInput('source', source);
    ref.setInput('url', url);
    ref.setInput('style', style);
    ref.setInput('dummy', dummy);
    ref.setInput('iframe', iframe);
    ref.instance.verified.subscribe(() => {
      if (source === GdprSource.ExternalUntrusted) {
        window.open(url, '_blank').focus();
        return;
      }
      onSubmit();
      dummy.parentNode.replaceChild(iframe, dummy);
      ref.destroy();
    });
    appRef.attachView(ref.hostView);
  }
}
