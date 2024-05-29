import { Component, HostBinding, Input } from '@angular/core';
import { carousel } from '../home-page-carousel';
import { M3SupportingPaneComponent } from '../../../../../modules/m3/components/layout/m3-supporting-pane/m3-supporting-pane.component';
import { MatGridList, MatGridTile } from '@angular/material/grid-list';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { NgClass, NgTemplateOutlet } from '@angular/common';
import { HomePageService } from '../home-page.service';
import { windowWatcher } from '../../../../../modules/navigation/utils/window-watcher';
import { language } from '../../../../base/language/language';
import {
  MatCard,
  MatCardContent,
  MatCardHeader,
  MatCardImage,
  MatCardTitle,
} from '@angular/material/card';
import { M3WindowSizeClass } from '../../../../../modules/m3/components/navigation/m3-navigation-types';

@Component({
  selector: 'app-feature-grid',
  standalone: true,
  imports: [
    M3SupportingPaneComponent,
    MatGridList,
    MatGridTile,
    MatIcon,
    MatIconButton,
    NgTemplateOutlet,
    MatCard,
    MatCardContent,
    MatCardHeader,
    MatCardImage,
    MatCardTitle,
    NgClass,
  ],
  templateUrl: './feature-grid.component.html',
  styleUrl: './feature-grid.component.scss',
})
export class FeatureGridComponent {
  protected readonly carousel = carousel;
  protected readonly Math = Math;
  protected featureState: boolean = false;
  protected readonly windowClass = windowWatcher.windowState;
  protected readonly language = language;

  @HostBinding('class.asDialog') get _asDialog() {
    return this.isDialog;
  }

  // eslint-disable-next-line @angular-eslint/no-input-rename
  @Input('isDialog') set _isDialog(value: boolean) {
    this.isDialog = value;
  }
  private isDialog: boolean;

  get currentWindowClass(): M3WindowSizeClass {
    if (this.isDialog) {
      return M3WindowSizeClass.Compact;
    } else {
      return this.windowClass();
    }
  }

  get carouselWindow() {
    return this.carousel.window[this.currentWindowClass];
  }

  constructor(protected self: HomePageService) {}
}
