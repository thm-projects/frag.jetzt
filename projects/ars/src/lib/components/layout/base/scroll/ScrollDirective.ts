import { AfterViewInit, Directive, ElementRef, Input, OnInit, Renderer2 } from '@angular/core';


@Directive({
  selector: '[ars-scroll]'
})
export class ScrollDirective implements OnInit, AfterViewInit {

  @Input() scroll = 'vertical';

  constructor(private ref: ElementRef, private render: Renderer2) {
  }

  ngOnInit() {
  }

  ngAfterViewInit() {
    if (this.scroll === 'horizontal') {
      this.render.setStyle(this.ref.nativeElement, 'overflow-y', 'hidden');
      this.render.setStyle(this.ref.nativeElement, 'overflow-x', 'scroll');
    } else {
      this.render.setStyle(this.ref.nativeElement, 'overflow-y', 'scroll');
      this.render.setStyle(this.ref.nativeElement, 'overflow-x', 'hidden');
    }

  }

}
