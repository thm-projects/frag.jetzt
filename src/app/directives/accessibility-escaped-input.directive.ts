import { AfterViewInit, Directive, ElementRef } from '@angular/core';
import { EventService } from '../services/util/event.service';

@Directive({
  selector: '[appAccessibilityEscapedInput]'
})
export class AccessibilityEscapedInputDirective implements AfterViewInit {

  constructor(private reference: ElementRef<HTMLElement>,
              private eventService: EventService) {
  }

  ngAfterViewInit(): void {
    const elem = this.reference.nativeElement;
    elem.addEventListener('focus', this.focus.bind(this));
    elem.addEventListener('blur', this.blur.bind(this));
    if (document.activeElement && document.activeElement.contains(elem)) {
      this.focus();
    }
  }

  private focus() {
    this.eventService.makeFocusOnInputTrue();
  }

  private blur() {
    this.eventService.makeFocusOnInputFalse();
  }

}
