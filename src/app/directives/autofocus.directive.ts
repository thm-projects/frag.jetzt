import { AfterViewInit, Directive, ElementRef } from '@angular/core';

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: '[autofocus]'
})
export class AutofocusDirective implements AfterViewInit {

  constructor(private host: ElementRef) {
  }

  ngAfterViewInit() {
    this.host.nativeElement.focus();
  }

}
