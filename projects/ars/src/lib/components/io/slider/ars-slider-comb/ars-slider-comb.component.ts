import { AfterViewInit, Component, ContentChild, ElementRef, Input, OnInit, Renderer2 } from '@angular/core';
import { ArsSliderDirective } from '../ars-slider.directive';

@Component({
  selector: 'ars-slider-comb',
  templateUrl: './ars-slider-comb.component.html',
  styleUrls: ['./ars-slider-comb.component.scss']
})
export class ArsSliderCombComponent implements OnInit, AfterViewInit {

  @Input() width: number;
  @Input() leftIcon = 'keyboard_arrow_left';
  @Input() rightIcon = 'keyboard_arrow_right';
  @ContentChild(ArsSliderDirective) slider: ArsSliderDirective;

  constructor(private ref: ElementRef, private render: Renderer2) {
  }

  ngOnInit() {
  }

  ngAfterViewInit() {
    this.slider.setWidth(this.width - 68);
    if (this.width) {
      this.render.setStyle(this.ref.nativeElement, 'width', this.width + 'px');
    }
  }

}
