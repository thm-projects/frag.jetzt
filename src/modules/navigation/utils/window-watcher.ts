import { Signal, signal } from '@angular/core';

export type WindowState =
  | 'compact'
  | 'medium'
  | 'expanded'
  | 'large'
  | 'extra-large';

class WindowWatcher {
  public readonly windowState: Signal<WindowState>;
  private readonly compact: MediaQueryList = matchMedia('(max-width: 599px)');
  private readonly medium: MediaQueryList = matchMedia('(max-width: 839px)');
  private readonly expanded: MediaQueryList = matchMedia('(max-width: 1199px)');
  private readonly large: MediaQueryList = matchMedia('(max-width: 1599px)');
  private readonly state = signal<WindowState>(this.getCurrentState());

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

  private getCurrentState(): WindowState {
    if (this.compact.matches) {
      return 'compact';
    }
    if (this.medium.matches) {
      return 'medium';
    }
    if (this.expanded.matches) {
      return 'expanded';
    }
    if (this.large.matches) {
      return 'large';
    }
    return 'extra-large';
  }
}

export const windowWatcher = new WindowWatcher();
