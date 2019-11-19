import { AfterViewInit, Component, ElementRef, Input, OnInit, Renderer2 } from '@angular/core';
import { FrameType } from '../FrameType';

@Component({
  selector: 'ars-row',
  templateUrl: './row.component.html',
  styleUrls: ['./row.component.scss'],
  providers: [FrameType.provide(RowComponent)]
})
export class RowComponent extends FrameType implements OnInit, AfterViewInit {

  @Input() overflow = 'visible';
  @Input() height: number;

  constructor(public ref: ElementRef, public render: Renderer2) {
    super('row');
  }

  ngOnInit() {
  }

  ngAfterViewInit() {
    if (this.height) {
      this.setPx(this.height);
    }
    this.updateOverflow();
  }

  /**
   * set height in %
   * @param height
   */
  public setPct(height: number) {
    this.setDim(height + '%');
  }

  /**
   * set height difference in px of 100%
   * calc( 100% - height )
   * @param height
   */
  public setDif(height: number) {
    this.setDim('calc( 100% - ' + height + 'px )');
  }

  /**
   * set height in px
   * @param height
   */
  public setPx(height: number) {
    this.setDim(height + 'px');
  }

  /**
   * returns rendered height
   */
  public get(): number {
    return this.getRenderedHeight();
  }

  public getRenderedHeight(): number {
    return this.ref.nativeElement.offsetHeight;
  }

  private setDim(style: string) {
    this.render.setStyle(this.ref.nativeElement, 'height', style);
  }

  private updateOverflow() {
    this.render.setStyle(this.ref.nativeElement, 'overflow', this.overflow);
  }

}
