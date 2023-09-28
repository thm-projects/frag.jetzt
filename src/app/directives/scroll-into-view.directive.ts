import { Directive, ElementRef, Input } from '@angular/core';
import { DeviceStateService } from 'app/services/state/device-state.service';

@Directive({
  selector: '[appScrollIntoView]',
})
export class ScrollIntoViewDirective {
  constructor(
    private element: ElementRef,
    private deviceState: DeviceStateService,
  ) {}

  @Input('appScrollIntoView') set active(value: boolean) {
    if (value) {
      setTimeout(() => {
        const args = this.deviceState.isSafari
          ? false
          : { behavior: 'smooth', block: 'center', inline: 'center' };
        this.element.nativeElement.scrollIntoView(args);
      });
    }
  }
}
