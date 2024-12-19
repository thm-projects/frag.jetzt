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
      // Temporarily remove 'max-height' to measure full content height
      const prevMaxHeight = elem.style.maxHeight;
      elem.style.maxHeight = '';
      const contentHeight = elem.scrollHeight;
      // Restore 'max-height'
      elem.style.maxHeight = prevMaxHeight;

      // Convert maxHeight to pixels
      const maxHeightValue = this.maxHeight();
      const maxHeightPixels = this.convertToPixels(maxHeightValue, elem);

      if (contentHeight > maxHeightPixels) {
        this.canCollapse.set(true);
      } else {
        this.canCollapse.set(false);
        this.collapsed.set(false);
      }
    });
  }

  private convertToPixels(value: string, element: HTMLElement): number {
    // Create a temporary element
    const tempDiv = document.createElement('div');
    tempDiv.style.height = value;
    element.appendChild(tempDiv);
    const pixels = tempDiv.clientHeight;
    element.removeChild(tempDiv);
    return pixels;
  }
}
