import rawI18n from './i18n.json';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
const i18n = I18nLoader.load(rawI18n);
import {
  Component,
  effect,
  ElementRef,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-collapsible-text',
  imports: [NgIf, MatButtonModule],
  templateUrl: './collapsible-text.component.html',
  styleUrl: './collapsible-text.component.scss',
})
export class CollapsibleTextComponent {
  text = input.required<string>();
  maxHeight = input<string>('6em');
  protected readonly i18n = i18n;
  protected readonly canCollapse = signal<boolean>(false);
  protected readonly collapsed = signal<boolean>(true);
  private ref = viewChild<ElementRef<HTMLElement>>('ref');

  constructor() {
    effect(() => {
      this.text();
      untracked(() => this.update());
    });
  }

  protected toggle() {
    if (!this.canCollapse()) return;
    this.collapsed.set(!this.collapsed());
    const elem = this.ref().nativeElement;
    elem.style.setProperty(
      'max-height',
      this.collapsed() ? this.maxHeight() : `${elem.scrollHeight}px`,
    );
  }

  private update() {
    if (!this.ref()) return;
    setTimeout(() => {
      const elem = this.ref().nativeElement;
      if (elem.clientHeight !== elem.scrollHeight) {
        this.canCollapse.set(true);
      } else {
        this.collapsed.set(false);
      }
    });
  }
}
