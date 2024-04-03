import { Directive, Input, OnDestroy, TemplateRef } from '@angular/core';
import { M3NavigationKind } from '../m3-nav-types';
import { M3NavigationService } from '../../../services/navigation/m3-navigation.service';

@Directive({
  selector: '[m3NavPortal]',
  standalone: true,
})
export class M3NavPortalDirective implements OnDestroy {
  protected _kind: M3NavigationKind | undefined;

  @Input('m3NavPortal') set _setTarget(kind: 'drawer' | 'rail') {
    // this.navigationService.build(kind as M3NavigationKind, this.template);
  }

  constructor(
    protected readonly navigationService: M3NavigationService,
    protected readonly template: TemplateRef<any>,
  ) {}

  ngOnDestroy() {
    if (this._kind) {
      // this.navigationService.destroy(this._kind);
    }
  }
}
