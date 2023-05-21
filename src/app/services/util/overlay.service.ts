import {
  ComponentRef,
  EventEmitter,
  Injectable,
  Injector,
} from '@angular/core';
import { ComponentType, Overlay, OverlayConfig } from '@angular/cdk/overlay';
import { Observable, ReplaySubject } from 'rxjs';
import { ComponentPortal } from '@angular/cdk/portal';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { LivepollSession } from '../../models/livepoll-session';

export interface ComposedOverlay<E, R, C> {
  component: ComponentRef<C>;

  beforeClosed(): Observable<R>;

  afterClosed(): Observable<R>;

  afterOpened(): Observable<void>;
}

export interface ComposedData<E = any, R = void, C = any> {
  _emit: {
    destroy: ReplaySubject<number>;
    emitClose: EventEmitter<R>;
    emitClosed: EventEmitter<R>;
    emitOpened: EventEmitter<void>;
  };
  ref: ComponentRef<C>;
  data: E;
}

@Injectable({
  providedIn: 'root',
})
export class OverlayService {
  private index: number = 0;

  constructor(private readonly overlay: Overlay) {}

  create<E, R, C>(
    component: ComponentType<C>,
    overlayConfig?: OverlayConfig | null,
    data: E = undefined,
  ): ComposedOverlay<E, R, C> {
    const backdropClass = '__backdrop_' + this.index++ + '_';
    const overlayRef = this.overlay.create({
      ...overlayConfig,
      ...({
        hasBackdrop: true,
        backdropClass,
      } as OverlayConfig),
    });
    const destroyer = new ReplaySubject(1);
    const emitClose = new EventEmitter<R>();
    const emitClosed = new EventEmitter<R>();
    const emitOpened = new EventEmitter<void>();
    const componentRef = overlayRef.attach(
      new ComponentPortal(
        component,
        null,
        Injector.create({
          providers: [
            {
              provide: MAT_DIALOG_DATA,
              useValue: {
                _emit: {
                  destroy: destroyer,
                  emitClose,
                  emitClosed,
                  emitOpened,
                },
                get ref(): ComponentRef<C> {
                  return componentRef;
                },
                data,
              } as ComposedData<E, R, C>,
            },
          ],
        }),
      ),
    );
    destroyer.subscribe(() => {
      componentRef.destroy();
      overlayRef.dispose();
    });
    overlayRef._outsidePointerEvents.subscribe((x: MouseEvent) => {
      const target = x.target as HTMLElement;
      if (target.className.includes(backdropClass)) {
        destroyer.next(1);
      }
    });
    return {
      component: componentRef,
      afterClosed: (): Observable<R> => emitClosed,
      beforeClosed: (): Observable<R> => emitClose,
      afterOpened: (): Observable<void> => emitOpened,
    };
  }
}
