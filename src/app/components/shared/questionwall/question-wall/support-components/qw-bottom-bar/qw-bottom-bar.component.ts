import { Component, Input } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { FormsModule } from '@angular/forms';
import {
  QuestionWallService,
  QuestionWallSession,
} from '../../question-wall.service';
import { QwScaleSliderComponent } from '../qw-scale-slider/qw-scale-slider.component';
import i18nRaw from '../../translation/qw.i18n.json';
import { I18nLoader } from '../../../../../../base/i18n/i18n-loader';

const i18n = I18nLoader.load(i18nRaw);

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'qw-bottom-bar',
  standalone: true,
  imports: [
    MatButton,
    MatIcon,
    MatSlideToggle,
    FormsModule,
    QwScaleSliderComponent,
  ],
  templateUrl: './qw-bottom-bar.component.html',
  styleUrl: './qw-bottom-bar.component.scss',
})
export class QwBottomBarComponent {
  @Input() session: QuestionWallSession;
  constructor(public readonly self: QuestionWallService) {}

  protected readonly i18n = i18n;
}
