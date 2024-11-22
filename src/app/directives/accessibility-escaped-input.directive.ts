import { AfterViewInit, Directive, ElementRef } from '@angular/core';
import { EventService } from '../services/util/event.service';

@Directive({
  selector: '[appAccessibilityEscapedInput]',
  standalone: false,
})
export class AccessibilityEscapedInputDirective implements AfterViewInit {
  constructor(
    private reference: ElementRef<HTMLElement>,
    private eventService: EventService,
  ) {}

  ngAfterViewInit(): void {
    const elem = this.reference.nativeElement;
    elem.addEventListener('focus', this.focus.bind(this));
    elem.addEventListener('blur', this.blur.bind(this));
    if (
      elem &&
      document.activeElement &&
      elem.contains(document.activeElement)
    ) {
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
