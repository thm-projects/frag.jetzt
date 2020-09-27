import { AfterViewInit, Component, ElementRef, Input, OnInit, Renderer2 } from '@angular/core';
import { FrameType } from '../FrameType';

@Component({
  selector: 'ars-col',
  templateUrl: './col.component.html',
  styleUrls: ['./col.component.scss'],
  providers: [FrameType.provide(ColComponent)]
})
export class ColComponent extends FrameType implements OnInit, AfterViewInit {

  @Input() overflow = 'visible';
  @Input() width: number;

  constructor(public ref: ElementRef, public render: Renderer2) {
    super('col');
  }

  ngOnInit() {
  }

  ngAfterViewInit() {
    if (this.width) {
      this.setPx(this.width);
    }
    this.updateOverflow();
  }

  /**
   * set width in %
   * @param width
   */
  public setPct(width: number) {
    this.setDim(width + '%');
  }

  /**
   * set width difference in px of 100%
   * calc( 100% - width )
   * @param width
   */
  public setDif(width: number) {
    this.setDim('calc( 100% - ' + width + 'px )');
  }

  /**
   * set width in px
   * @param width
   */
  public setPx(width: number) {
    this.setDim(width + 'px');
  }

  /**
   * returns rendered width
   */
  public get(): number {
    return this.getRenderedWidth();
  }

  public getRenderedWidth(): number {
    return this.ref.nativeElement.offsetWidth;
  }

  private setDim(style: string) {
    this.render.setStyle(this.ref.nativeElement, 'width', style);
  }

  private updateOverflow() {
    this.render.setStyle(this.ref.nativeElement, 'overflow', this.overflow);
  }

}
