import { Directive, ElementRef, Input } from '@angular/core';

@Directive({
  selector: '[appScrollIntoView]'
})
export class ScrollIntoViewDirective {

  constructor(
    private element: ElementRef
  ) {
  }

  @Input('appScrollIntoView') set active(value: boolean) {
    if (value) {
      setTimeout(() => this.element.nativeElement.scrollIntoView({ behavior: 'smooth' }));
    }
  }

}
