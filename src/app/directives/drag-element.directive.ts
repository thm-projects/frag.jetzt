import {
  AfterViewInit,
  Directive,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  Renderer2,
  ViewContainerRef,
} from '@angular/core';
import { Observable, Subject, takeUntil } from 'rxjs';

interface GotData {
  event: 'got-data';
  data: DragEvent;
}

interface Drag {
  event: 'drag';
  dragging: boolean;
}

type EventValidator = (
  event: 'drop' | 'enter' | 'leave',
  e: DragEvent,
) => boolean;

const listenFileDrop = (
  isValid: EventValidator,
): Observable<GotData | Drag> => {
  return new Observable((subscriber) => {
    let isDragging = false;
    const set = new Set();
    const dropListener = (e: DragEvent) => {
      if (!isValid('drop', e)) {
        return;
      }
      if (isDragging) {
        isDragging = false;
        set.clear();
        subscriber.next({ event: 'drag', dragging: false });
      }
      e.preventDefault();
      e.stopPropagation();
      subscriber.next({ event: 'got-data', data: e });
    };
    const enterListener = (e: DragEvent) => {
      if (!isValid('enter', e)) {
        return;
      }
      set.add(e.target);
      e.preventDefault();
      e.stopPropagation();
      if (!isDragging) {
        isDragging = true;
        subscriber.next({ event: 'drag', dragging: true });
      }
    };
    const leaveListener = (e: DragEvent) => {
      if (!isValid('leave', e)) {
        return;
      }
      set.delete(e.target);
      e.preventDefault();
      e.stopPropagation();
      if (set.size === 0 && isDragging) {
        isDragging = false;
        subscriber.next({ event: 'drag', dragging: false });
      }
    };
    const overListener = (e: DragEvent) => {
      if (!isValid('leave', e)) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
    };
    window.addEventListener('dragenter', enterListener);
    window.addEventListener('dragover', overListener);
    window.addEventListener('dragleave', leaveListener);
    window.addEventListener('drop', dropListener);
    return () => {
      window.removeEventListener('dragenter', enterListener);
      window.removeEventListener('dragover', overListener);
      window.removeEventListener('dragleave', leaveListener);
      window.removeEventListener('drop', dropListener);
    };
  });
};

@Directive({
  selector: '[appDragElement]',
})
export class DragElementDirective implements AfterViewInit, OnDestroy {
  @Input()
  eventValidator: EventValidator;
  @Output()
  fileDrop = new EventEmitter<DragEvent>();
  protected isDragging = false;
  private destroyer = new Subject<void>();

  constructor(
    private renderer2: Renderer2,
    private viewContainerRef: ViewContainerRef,
  ) {}

  isValid(event: 'drop' | 'enter' | 'leave', e: DragEvent): boolean {
    return this.eventValidator?.(event, e) ?? true;
  }

  ngAfterViewInit(): void {
    const elem = this.viewContainerRef.element.nativeElement;
    this.renderer2.setStyle(elem, 'position', 'fixed');
    this.renderer2.setStyle(elem, 'top', '0');
    this.renderer2.setStyle(elem, 'left', '0');
    this.renderer2.setStyle(elem, 'width', '100%');
    this.renderer2.setStyle(elem, 'height', '100%');
    this.renderer2.setStyle(elem, 'zIndex', '1000');
    this.renderer2.setStyle(
      elem,
      'backdrop-filter',
      'blur(0.5rem) contrast(0.67)',
    );
    elem.remove();
    listenFileDrop(this.isValid.bind(this))
      .pipe(takeUntil(this.destroyer))
      .subscribe((event) => {
        if (event.event === 'got-data') {
          this.fileDrop.emit(event.data);
          return;
        }
        this.isDragging = event.dragging;
        if (this.isDragging) {
          this.renderer2.appendChild(document.body, elem);
        } else {
          this.renderer2.removeChild(document.body, elem);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroyer.next();
    this.destroyer.complete();
  }
}
