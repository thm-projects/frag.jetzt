import { Directive, Input } from '@angular/core';
import { M3WindowClass } from '../navigation/m3-navigation-types';

@Directive({
  selector: 'div[m3WindowClass]',
  standalone: true,
  host: {
    '[class]': `cssClass`,
  },
})
export class M3WindowClassDirective {
  private _m3WindowClassExpression: string;

  @Input('m3WindowClass') set m3WindowClass(value: M3WindowClass['window']) {
    if (!value) {
      this._m3WindowClass = undefined;
    } else {
      const [l, r] = Object.entries(value)[0];
      this._m3WindowClassExpression = `m3-window-class-${l}-${r}`;
      this._m3WindowClass = value;
    }
  }

  get m3WindowClass(): M3WindowClass['window'] {
    return this._m3WindowClass;
  }

  private _m3WindowClass: M3WindowClass['window'];

  protected get cssClass() {
    return this.m3WindowClass ? `${this._m3WindowClassExpression}` : ``;
  }
}
