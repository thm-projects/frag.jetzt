import { AfterViewInit, Component, ElementRef, Input, OnInit, Renderer2 } from '@angular/core';

@Component({
  selector: 'ars-fill',
  templateUrl: './fill.component.html',
  styleUrls: ['./fill.component.scss']
})
export class FillComponent implements OnInit, AfterViewInit {

  @Input() overflow = 'visible';

  constructor(public ref: ElementRef, public render: Renderer2) {
  }

  ngOnInit() {
  }

  ngAfterViewInit() {
    this.updateOverflow();
    this.getWidth = () => {
      return this.ref.nativeElement.offsetWidth;
    };
    this.getHeight = () => {
      return this.ref.nativeElement.offsetHeight;
    };
  }

  public getWidth(): number {
    return 0;
  }

  public getHeight(): number {
    return 0;
  }

  private updateOverflow() {
    this.render.setStyle(this.ref.nativeElement, 'overflow', this.overflow);
  }

}
