import { BehaviorSubject, Observable } from 'rxjs';

export class ShrinkObserver {
  private readonly element: HTMLElement;
  private readonly resizeObserver = new ResizeObserver(
    this.onAction.bind(this),
  );
  private readonly mutateObserver = new MutationObserver(
    this.onAction.bind(this),
  );
  private readonly isSmall = new BehaviorSubject(false);
  private fullSize = 0;

  constructor(elem: HTMLElement) {
    this.element = elem;
    this.resizeObserver.observe(elem);
    this.mutateObserver.observe(elem, {
      subtree: true,
      childList: true,
      characterData: true,
    });
    this.onAction();
  }

  observeShrink(): Observable<boolean> {
    return this.isSmall.asObservable();
  }

  disconnect() {
    this.resizeObserver.disconnect();
    this.mutateObserver.disconnect();
    this.isSmall.complete();
  }

  private onAction() {
    if (this.isSmall.value) {
      if (this.element.offsetWidth > this.fullSize) {
        this.isSmall.next(false);
      }
    } else {
      this.fullSize = this.element.scrollWidth;
      if (this.element.scrollWidth - this.element.offsetWidth > 0) {
        this.isSmall.next(true);
      }
    }
  }
}
