import { CommonModule } from '@angular/common';
import {
  Component,
  HostBinding,
  Injector,
  effect,
  inject,
  input,
} from '@angular/core';
import { MatBadgeModule, MatBadgeSize } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { TruncateBadgePipe } from 'app/utils/truncate-badge.pipe';

@Component({
  selector: 'expanded-navigation-button',
  imports: [
    MatButtonModule,
    MatIconModule,
    CommonModule,
    MatSlideToggleModule,
    MatBadgeModule,
    TruncateBadgePipe,
  ],
  templateUrl: './expanded-navigation-button.component.html',
  styleUrl: './expanded-navigation-button.component.scss',
})
export class ExpandedNavigationButtonComponent {
  active = input(false);
  icon = input('unknown_document');
  svgIcon = input('');
  title = input('Button');
  endIcon = input('');
  endSwitch = input<boolean>(undefined);
  badgeSize = input<MatBadgeSize>('medium');
  badgeCount = input<number>(0);
  badgeOverlap = input<boolean>(false);
  private injector = inject(Injector);

  constructor() {
    effect(() => {}, { injector: this.injector });
  }

  get shouldBeHighlighted() {
    return this.badgeCount() > 0 && this.badgeSize() === 'small';
  }
}
