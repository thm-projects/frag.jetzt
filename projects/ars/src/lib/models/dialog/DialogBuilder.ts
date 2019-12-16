import { Overlay, OverlayConfig, OverlayRef } from '@angular/cdk/overlay';
import { DialogEvent } from '../../components/content/dialog/DialogEvent';
import { ComponentPortal } from '@angular/cdk/portal';
import { DialogInstance } from './DialogInstance';


export class DialogBuilder {

  private static builder: DialogBuilder;

  public static init(overlay: Overlay) {
    if (this.builder) {
      console.warn('DialogBuilder already initialized.');
      return;
    }
    this.builder = new DialogBuilder(overlay);
  }

  public static createDialog(cls: any, e?: DialogEvent) {
    const overlayRef = this.builder.create();
    const portal = new ComponentPortal(cls);
    const componentRef = overlayRef.attach(portal);
    if (typeof e === 'undefined') {
      e = <DialogEvent>componentRef.instance;
    }
    e.closeEmit.subscribe(() => {
      overlayRef.detach();
    });
    return new DialogInstance(overlayRef, portal, componentRef);
  }

  private constructor(private overlay: Overlay) {
  }

  private create(config?: OverlayConfig): OverlayRef {
    return this.overlay.create(config);
  }

}

