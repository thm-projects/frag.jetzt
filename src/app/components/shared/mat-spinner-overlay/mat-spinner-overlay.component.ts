import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnInit,
  Renderer2,
  RendererStyleFlags2,
  ViewChild
} from '@angular/core';
import { ProgressSpinnerMode } from '@angular/material/progress-spinner';
import { ThemePalette } from '@angular/material/core';

@Component({
  selector: 'app-mat-spinner-overlay',
  templateUrl: './mat-spinner-overlay.component.html',
  styleUrls: ['./mat-spinner-overlay.component.scss']
})
export class MatSpinnerOverlayComponent implements OnInit, AfterViewInit {

  @ViewChild('containerRef') containerRef: ElementRef;
  @Input() value = 100;
  @Input() diameter = 100;
  @Input() mode: ProgressSpinnerMode = 'indeterminate';
  @Input() strokeWidth = 10;
  @Input() overlay = false;
  @Input() color: ThemePalette = 'primary';
  /**
   * Overrides diameter and strokeWidth settings, only possible if overlay is false
   */
  @Input() parentFontContainer: HTMLElement = null;
  @Input() useCustomCSSColor = false;

  constructor(private element: ElementRef<HTMLElement>,
              private renderer2: Renderer2) {
  }

  ngOnInit(): void {
    if (this.parentFontContainer && !this.overlay) {
      const elem = this.renderer2.createElement('canvas');
      const ctx = elem.getContext('2d');
      const style = window.getComputedStyle(this.parentFontContainer);
      ctx.font = style.font;
      const metric = ctx.measureText(this.parentFontContainer.innerText);
      this.diameter = Math.abs(metric.fontBoundingBoxAscent) + Math.abs(metric.actualBoundingBoxDescent);
      this.strokeWidth = this.diameter / 10;
    }
  }

  ngAfterViewInit() {
    const svg = this.element.nativeElement.getElementsByTagName('svg');
    if (svg.length < 1) {
      return;
    }
    this.renderer2.setStyle(svg[0], 'position', 'static');
    if (this.useCustomCSSColor && svg[0].firstElementChild) {
      this.renderer2.setStyle(svg[0].firstElementChild, 'stroke', 'currentColor', RendererStyleFlags2.Important);
    }
  }

}
