import { AfterViewInit, ContentChildren, Directive, ElementRef, Input, OnInit, QueryList, Renderer2 } from '@angular/core';
import { ButtonBaseDirective } from './ButtonBase.directive';
import { FrameType } from '../../layout/frame/FrameType';


@Directive({
  selector: '[ars-btn-wrp]'
})
export class ButtonWrapperDirective implements OnInit, AfterViewInit {

  @Input() xs: number;
  @Input() ys: number;
  @Input() xe: number;
  @Input() ye: number;

  @Input() xp = 0;
  @Input() yp = 0;

  @Input() extra: boolean;
  @Input() extraStart: boolean;
  @Input() extraEnd: boolean;

  @ContentChildren(ButtonBaseDirective, { descendants: false }) btn: QueryList<ButtonBaseDirective>;

  constructor(private ref: ElementRef, private render: Renderer2, private ft: FrameType) {
  }

  ngOnInit() {
    if (typeof this.xs === 'undefined') {
      this.xs = this.xp;
    }
    if (typeof this.ys === 'undefined') {
      this.ys = this.yp;
    }
    if (typeof this.xe === 'undefined') {
      this.xe = this.xp;
    }
    if (typeof this.ye === 'undefined') {
      this.ye = this.yp;
    }
    if (this.extra) {
      this.extraStart = true;
      this.extraEnd = true;
    }
  }

  ngAfterViewInit() {

    // init direction of all buttons
    // when btn-wrp is col => menu must be row => horizontal-menu => all buttons fill height
    // when btn-wrp is row => menu must be col => vertical-menu => all buttons fill width
    this.btn.forEach(e => e.setDirection(this.ft.getOppositeFrameType()));

    // update direction
    this.btn.forEach(e => e.updateDirection());

    // init padding for each button
    if (this.ft.isCol()) {
      this.btn.forEach(e => e.setPadding(this.xs / 2, this.xe / 2, 0, 0));
      if (this.extraStart) {
        this.btn.first.setPaddingLeft(this.xs);
      }
      if (this.extraEnd) {
        this.btn.last.setPaddingRight(this.xe);
      }
    } else {
      this.btn.forEach(e => e.setPadding(this.xs / 2, this.xe / 2, this.ys / 2, this.ye / 2));
      if (this.extraStart) {
        this.btn.first.setPaddingTop(this.ys);
      }
      if (this.extraEnd) {
        this.btn.last.setPaddingBottom(this.ye);
      }
    }

    // render style for each button
    this.btn.forEach(e => e.updateStyle());

  }

}
