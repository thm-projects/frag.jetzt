import { Signal, signal } from '@angular/core';
import { M3WindowSizeClass } from '../../m3/components/navigation/m3-navigation-types';

/**
 * note: check if scss window classes can be used instead.
 * e.g.: m3-layout.explicit-range(compact, large)
 * only use this if necessary.
 */
class WindowWatcher {
  public readonly windowState: Signal<M3WindowSizeClass>;
  private readonly compact: MediaQueryList = matchMedia('(max-width: 599px)');
  private readonly medium: MediaQueryList = matchMedia('(max-width: 839px)');
  private readonly expanded: MediaQueryList = matchMedia('(max-width: 1199px)');
  private readonly large: MediaQueryList = matchMedia('(max-width: 1599px)');
  private readonly state = signal<M3WindowSizeClass>(this.getCurrentState());

  constructor() {
    this.windowState = this.state.asReadonly();
    this.compact.addEventListener('change', () => this.update());
    this.medium.addEventListener('change', () => this.update());
    this.expanded.addEventListener('change', () => this.update());
    this.large.addEventListener('change', () => this.update());
  }

  private update() {
    const last = this.state();
    const current = this.getCurrentState();
    if (last !== current) {
      this.state.set(current);
    }
  }

  private getCurrentState(): M3WindowSizeClass {
    if (this.compact.matches) {
      return M3WindowSizeClass.Compact;
    }
    if (this.medium.matches) {
      return M3WindowSizeClass.Medium;
    }
    if (this.expanded.matches) {
      return M3WindowSizeClass.Expanded;
    }
    if (this.large.matches) {
      return M3WindowSizeClass.Large;
    }
    return M3WindowSizeClass.ExtraLarge;
  }
}
export const windowWatcher = new WindowWatcher();
