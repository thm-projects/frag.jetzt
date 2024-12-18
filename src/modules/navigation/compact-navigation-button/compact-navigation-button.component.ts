import { CommonModule } from '@angular/common';
import { Component, Injector, effect, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatBadgeModule, MatBadgeSize } from '@angular/material/badge';
import { TruncateBadgePipe } from 'app/utils/truncate-badge.pipe';

@Component({
  selector: 'compact-navigation-button',
  imports: [
    MatButtonModule,
    MatIconModule,
    CommonModule,
    MatSlideToggleModule,
    MatBadgeModule,
    TruncateBadgePipe,
  ],
  templateUrl: './compact-navigation-button.component.html',
  styleUrl: './compact-navigation-button.component.scss',
})
export class CompactNavigationButtonComponent {
  active = input(false);
  icon = input('unknown_document');
  svgIcon = input('');
  title = input('Button');
  badgeSize = input<MatBadgeSize>('medium');
  badgeCount = input<number>(0);
  badgeOverlap = input<boolean>(true);
  private injector = inject(Injector);

  constructor() {
    effect(() => {}, { injector: this.injector });
  }

  get shouldBeHighlighted() {
    return this.badgeCount() > 0 && this.badgeSize() === 'small';
  }
}
