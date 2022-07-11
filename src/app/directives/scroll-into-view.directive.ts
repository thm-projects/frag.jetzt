import { Directive, ElementRef, Input } from '@angular/core';
import { DeviceInfoService } from '../services/util/device-info.service';

@Directive({
  selector: '[appScrollIntoView]'
})
export class ScrollIntoViewDirective {

  constructor(
    private element: ElementRef,
    private deviceInfo: DeviceInfoService,
  ) {
  }

  @Input('appScrollIntoView') set active(value: boolean) {
    if (value) {
      setTimeout(() => {
        const args = this.deviceInfo.isSafari ? false : { behavior: 'smooth', block: 'center', inline: 'center' };
        this.element.nativeElement.scrollIntoView(args);
      });
    }
  }

}
