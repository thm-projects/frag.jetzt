import { AfterViewInit, Directive, ElementRef, OnInit, Renderer2 } from '@angular/core';


@Directive({
  selector: '[ars-btn]'
})
export class ButtonBaseDirective implements OnInit, AfterViewInit {

  private direction: string;
  private left: number;
  private right: number;
  private top: number;
  private bottom: number;

  constructor(private ref: ElementRef, private render: Renderer2) {
  }

  ngOnInit() {
  }

  ngAfterViewInit() {
  }

  setDirection(direction: string) {
    this.direction = direction;
  }

  updateDirection() {
    if (this.direction === 'row') {
      this.setStyle('height', '100%');
    } else if (this.direction === 'col') {
      this.setStyle('width', '100%');
    } else {
      if (typeof this.direction === 'undefined') {
        console.error('undefined direction');
      } else {
        console.error('unknown direction: ' + this.direction);
      }
    }
  }

  setStyle(style: string, value: any) {
    this.render.setStyle(this.ref.nativeElement, style, value);
  }

  setPaddingLeft(left: number) {
    this.left = left;
  }

  setPaddingRight(right: number) {
    this.right = right;
  }

  setPaddingTop(top: number) {
    this.top = top;
  }

  setPaddingBottom(bottom: number) {
    this.bottom = bottom;
  }

  setPadding(left: number, right: number, top: number, bottom: number) {
    this.left = left;
    this.right = right;
    this.top = top;
    this.bottom = bottom;
  }

  updateStyle() {
    this.setStyle('padding', this.top + 'px ' + this.right + 'px ' + this.bottom + 'px ' + this.left + 'px');
  }

}
