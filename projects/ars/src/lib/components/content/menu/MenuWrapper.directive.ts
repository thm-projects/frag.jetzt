import { AfterViewInit, Directive, ElementRef, OnInit, Renderer2 } from '@angular/core';
import { FrameType } from '../../layout/frame/FrameType';
import { WrapperDirective } from '../../layout/frame/wrp/WrapperDirective';


@Directive({
  selector: '[ars-menu]'
})
export class MenuWrapperDirective extends WrapperDirective implements OnInit, AfterViewInit {

  constructor(ref: ElementRef, render: Renderer2, private ft: FrameType) {
    super(ref, render);
  }

  ngOnInit() {
    super.ngOnInit();
  }

  ngAfterViewInit() {
    super.ngAfterViewInit();
  }

}
