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
  ViewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-collapsible-text',
  imports: [MatButtonModule],
  templateUrl: './collapsible-text.component.html',
  styleUrl: './collapsible-text.component.scss',
})
export class CollapsibleTextComponent {
  text = input.required<string>();
  maxHeight = input<string>('6em');

  protected readonly i18n = i18n;
  protected readonly canCollapse = signal<boolean>(true);
  protected readonly collapsed = signal<boolean>(true);
  protected readonly displayHeight = signal<string>(this.maxHeight());

  @ViewChild('textWrapperRef', { static: true })
  textWrapperRef!: ElementRef<HTMLElement>;
  @ViewChild('textRef', { static: true }) textRef!: ElementRef<HTMLElement>;

  constructor() {
    effect(() => {
      this.text();
      untracked(() => this.checkCanCollapse());
    });
  }

  private checkCanCollapse() {
    // This delay prevents a race condition. Without it, the heights of the text
    // and container might be measured too early, resulting in them appearing
    // equal. This would cause the component to not collapse when it should.
    // The delay is minimal enough to not be noticeable to the user.
    const delay = 20;
    if (!this.textRef && !this.textWrapperRef) return;
    setTimeout(() => {
      const textContainer = this.textWrapperRef.nativeElement;
      const textContentHeight = this.textRef.nativeElement.scrollHeight;
      const textContainerHeight = textContainer.clientHeight;
      this.canCollapse.set(textContentHeight > textContainerHeight);
      this.collapsed.set(this.canCollapse());
    }, delay);
  }

  protected toggle() {
    this.collapsed.update((collapsed) => !collapsed);
    const fullContentHeight = `${this.textWrapperRef.nativeElement.scrollHeight}px`;
    this.displayHeight.set(
      this.collapsed() ? this.maxHeight() : fullContentHeight,
    );
  }
}
