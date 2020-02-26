import { AfterViewInit, Component, ElementRef, Input, OnInit, Renderer2, ViewChild } from '@angular/core';

@Component({
  selector: 'ars-flex-align',
  templateUrl: './flex-align.component.html',
  styleUrls: ['./flex-align.component.scss']
})
export class FlexAlignComponent implements OnInit, AfterViewInit {

  @Input() align = 'center';
  @Input() width: number;
  @Input() margin: number;
  @ViewChild('col') col: ElementRef;

  constructor(private ref: ElementRef, private render: Renderer2) {
  }

  ngOnInit() {
  }

  ngAfterViewInit() {
    if (this.align === 'center') {
      this.setStyle('justify-content', 'center');
    } else if (this.align === 'left') {
      this.setStyle('justify-content', 'flex-start');
    } else if (this.align === 'right') {
      this.setStyle('justify-content', 'flex-end');
    } else {
      console.error('Unknown align argument: ' + this.align);
    }
    this.setStyleCol('width', this.width + 'px');
    if (typeof this.margin !== 'undefined') {
      this.setStyleCol('margin', '0px ' + this.margin + 'px');
    }
  }

  setStyle(style: string, value: any) {
    this.render.setStyle(this.ref.nativeElement, style, value);
  }

  setStyleCol(style: string, value: any) {
    this.render.setStyle(this.col.nativeElement, style, value);
  }

}
