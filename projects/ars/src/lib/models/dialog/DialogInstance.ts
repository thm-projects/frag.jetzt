import { OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { ComponentRef } from '@angular/core';


export class DialogInstance<E> {

  constructor(
    public overlayRef: OverlayRef,
    public portal: ComponentPortal<E>,
    public componentRef: ComponentRef<E>
  ) {
  }

  public getInstance(): E {
    return this.componentRef.instance;
  }

}
