import { AfterViewInit, Directive, Input, OnInit, Renderer2 } from '@angular/core';
import { MatSlider } from '@angular/material';


@Directive({
  selector: '[ars-slider]'
})
export class ArsSliderDirective implements OnInit, AfterViewInit {

  public static classes: Object = {
    'mat-slider-wrapper': '',
    'mat-slider-track-wrapper': 'rgba(127,127,127,0.5)',
    'mat-slider-track-background': '',
    'mat-slider-track-fill': 'var(--on-surface)',
    'mat-slider-ticks-container': '',
    'mat-slider-ticks': '',
    'mat-slider-focus-ring': 'var(--on-surface)',
    'mat-slider-thumb': 'var(--on-surface)',
    'mat-slider-thumb-container': 'var(--on-surface)',
    'mat-slider-thumb-label': '',
    'mat-slider-thumb-label-text': ''
  };

  @Input() width: number;

  private elem: HTMLInputElement;

  constructor(private slider: MatSlider, private render: Renderer2) {
    this.elem = slider._elementRef.nativeElement;
  }

  ngOnInit() {
  }

  ngAfterViewInit() {
    Array.from(this.elem.getElementsByTagName('*')).forEach(e => {
      if (ArsSliderDirective.classes.hasOwnProperty(e.className)) {
        (<HTMLElement>e).style.background = ArsSliderDirective.classes[e.className];
      }
    });
    this.render.setStyle(this.elem, 'height', '48px');
    this.render.setStyle(this.elem, 'minHeight', '48px');
    this.render.setStyle(this.elem, 'maxHeight', '48px');
    this.updateWidth();
  }

  public setWidth(width: number) {
    this.width = width;
    this.updateWidth();
  }

  private updateWidth() {
    this.render.setStyle(this.elem, 'width', this.width + 'px');
    this.render.setStyle(this.elem, 'minWidth', this.width + 'px');
    this.render.setStyle(this.elem, 'maxWidth', this.width + 'px');
  }

  public next() {
    this.slider.value += this.slider.step;
    if (this.slider.value > this.slider.max) {
      this.slider.value = this.slider.max;
    }
  }

  public prev() {
    this.slider.value -= this.slider.step;
    if (this.slider.value < this.slider.min) {
      this.slider.value = this.slider.min;
    }
  }

}
