import { AfterViewInit, Directive, ElementRef, OnInit, Renderer2 } from '@angular/core';


@Directive({
  selector: '[ars-flex-box]'
})
export class WrapperDirective implements OnInit, AfterViewInit {

  public direction: string;

  constructor(public ref: ElementRef, public render: Renderer2) {
  }

  ngOnInit() {
  }

  ngAfterViewInit() {
    this.direction = this.getDirection();
    this.render.setStyle(this.ref.nativeElement, 'display', 'flex');
    this.render.setStyle(this.ref.nativeElement, 'justify-content', 'space-between');
    this.render.setStyle(this.ref.nativeElement, 'overflow', 'auto');
    this.render.setStyle(this.ref.nativeElement, 'flex-direction', this.direction);
  }

  private getDirection(): string {
    let rows = 0;
    let cols = 0;
    Array.from((<HTMLElement>this.ref.nativeElement).children).forEach(e => {
      if (e.tagName === 'ARS-ROW') {
        rows++;
      }
      if (e.tagName === 'ARS-COL') {
        cols++;
      }
    });
    return rows < cols ? 'row' : 'column';
  }

}
