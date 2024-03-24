import { Directive, Input, OnDestroy } from '@angular/core';
import { M3DynamicThemeService } from '../../services/dynamic-theme/m3-dynamic-theme.service';
import { M3DynamicColorState } from '../../services/dynamic-theme/m3-dynamic-theme-utility';

@Directive({
  selector: '[m3DynamicThemePortal]',
  standalone: true,
})
export class M3DynamicThemePortalDirective implements OnDestroy {
  @Input('m3DynamicThemePortal') set _color(color: string) {
    this.m3DynamicColorState =
      this.m3DynamicThemeService.createColorState(color);
    this.m3DynamicThemeService.loadColor(this.m3DynamicColorState.current);
  }

  private m3DynamicColorState: M3DynamicColorState;

  constructor(public readonly m3DynamicThemeService: M3DynamicThemeService) {}

  ngOnDestroy(): void {
    if (this.m3DynamicColorState) {
      this.m3DynamicThemeService.destroyColorState(this.m3DynamicColorState);
    }
  }
}
