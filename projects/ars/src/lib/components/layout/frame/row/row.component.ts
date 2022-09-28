import { AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { FrameType } from '../FrameType';

@Component({
  selector: 'ars-row',
  templateUrl: './row.component.html',
  styleUrls: ['./row.component.scss'],
  providers: [FrameType.provide(RowComponent)],
})
export class RowComponent extends FrameType implements OnInit, AfterViewInit, OnDestroy {

  @Input() overflow = 'visible';
  @Input() height: number;
  @Input() autoHeight: boolean = false;
  private _isDimSet = false;
  private _addedChildren: MutationObserver;

  constructor(
    public ref: ElementRef,
    public render: Renderer2,
  ) {
    super('row');
  }

  ngOnInit() {
  }

  ngAfterViewInit() {
    this._addedChildren = new MutationObserver(() => this.resize());
    this._addedChildren.observe(this.ref.nativeElement, {
      childList: true,
      subtree: true,
    });
    this.resize(true);
    this.updateOverflow();
  }

  ngOnDestroy() {
    this._addedChildren.disconnect();
    this._addedChildren = null;
  }

  public setAutoHeight(autoHeightEnabled: boolean) {
    this.autoHeight = autoHeightEnabled;
    this.resize();
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

  public setOverflow(overflow: string) {
    this.overflow = overflow;
    this.updateOverflow();
  }

  public getRenderedHeight(): number {
    const native = this.ref.nativeElement;
    return native.firstElementChild?.offsetHeight || native.offsetHeight;
  }

  public resize(force = false): void {
    if (!this._isDimSet && !force) {
      return;
    }
    if (this.autoHeight) {
      this.setPx(this.getRenderedHeight());
      return;
    }
    if (this.height) {
      this.setPx(this.height);
    }
  }

  private setDim(style: string) {
    this._isDimSet = Boolean(style);
    this.render.setStyle(this.ref.nativeElement, 'height', style);
  }

  private updateOverflow() {
    this.render.setStyle(this.ref.nativeElement, 'overflow', this.overflow);
  }

}
