import {
  AfterViewInit,
  booleanAttribute,
  Component,
  ElementRef,
  inject,
  Input,
  OnDestroy,
} from '@angular/core';
import { MatRipple, MatRippleLoader } from '@angular/material/core';
import { FocusMonitor } from '@angular/cdk/a11y';

@Component({
  selector: `button[m3-label-button]`,
  templateUrl: 'label-button.html',
  host: {
    class: 'm3-label-button __drawers',
  },
  standalone: true,
  styleUrls: ['label-button.scss'],
})
export class M3LabelButton implements AfterViewInit, OnDestroy {
  private readonly _focusMonitor = inject(FocusMonitor);
  // todo(lph) on active label state, keep ripple expanded in specified color
  _rippleLoader: MatRippleLoader = inject(MatRippleLoader);

  constructor(private readonly _elementRef: ElementRef) {
    const element = _elementRef.nativeElement as HTMLDivElement;
    this._rippleLoader?.configureRipple(element, {
      className: 'mat-mdc-button-ripple',
    });
  }
  @Input({ transform: booleanAttribute })
  get disableRipple(): boolean {
    return this._disableRipple;
  }
  set disableRipple(value: any) {
    this._disableRipple = value;
    this._updateRippleDisabled();
  }
  private _disableRipple: boolean = false;

  @Input({ transform: booleanAttribute })
  get disabled(): boolean {
    return this._disabled;
  }
  set disabled(value: any) {
    this._disabled = value;
    this._updateRippleDisabled();
  }
  private _disabled: boolean = false;

  get ripple(): MatRipple {
    return this._rippleLoader?.getRipple(this._elementRef.nativeElement);
  }

  set ripple(matRipple: MatRipple) {
    this._rippleLoader?.attachRipple(this._elementRef.nativeElement, matRipple);
  }

  ngAfterViewInit() {
    this._focusMonitor.monitor(this._elementRef, true);
  }

  ngOnDestroy() {
    this._focusMonitor.stopMonitoring(this._elementRef);
    this._rippleLoader?.destroyRipple(this._elementRef.nativeElement);
  }

  private _updateRippleDisabled(): void {
    this._rippleLoader?.setDisabled(
      this._elementRef.nativeElement,
      this.disableRipple || this.disabled,
    );
  }
}
