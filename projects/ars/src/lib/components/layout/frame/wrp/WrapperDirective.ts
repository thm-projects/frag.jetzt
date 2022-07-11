import {AfterViewInit, Directive, ElementRef, Input, OnInit, Renderer2} from '@angular/core';


@Directive({
  selector: '[ars-flex-box]'
})
export class WrapperDirective implements OnInit, AfterViewInit {

  @Input() align: string = 'space-between';
  @Input() borderBox: boolean = false;
  @Input() padding: number[]|number = null;
  @Input() direction: string = null;
  public _direction: string;

  constructor(public ref: ElementRef, public render: Renderer2) {
  }

  ngOnInit() {
  }

  private setStyle(left:string,right:string) {
    this.render.setStyle(this.ref.nativeElement, left,right);
  }

  ngAfterViewInit() {
    this._direction = this.getDirection();
    this.setStyle('display', 'flex');
    this.setStyle('justify-content', this.align);
    this.setStyle('overflow', 'auto');
    this.setStyle('flex-direction', this._direction);
    if(this.borderBox){
      this.setStyle('box-sizing', 'border-box');
    }
    if(this.padding){
      if(typeof this.padding === "object")
        this.setStyle('padding',this.padding.map(x=>x+'px').join(' '));
      else
        this.setStyle('padding',this.padding+'px');
    }
  }

  private getDirection(): string {
    if(this.direction)return this.direction;
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
