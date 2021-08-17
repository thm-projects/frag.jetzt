import { Directive, ElementRef, Input } from '@angular/core';

@Directive({
  selector: '[appScrollIntoView]'
})
export class ScrollIntoViewDirective {

  @Input('appScrollIntoView')
  set active(value: boolean) {
    if (value) {
      this.element.nativeElement.scrollIntoView({ behavior: 'smooth' });
    }
  }

  constructor(private element: ElementRef) {
  }

}
