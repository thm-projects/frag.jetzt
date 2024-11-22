import { Component, Input } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatSlider, MatSliderThumb } from '@angular/material/slider';
import { SortType } from '../../../../../../utils/data-filter-object.lib';
import { HeaderService } from '../../../../../../services/util/header.service';
import {
  QuestionWallService,
  QuestionWallSession,
} from '../../question-wall.service';
import { FormsModule } from '@angular/forms';
import { MatTooltip } from '@angular/material/tooltip';
import { EssentialsModule } from '../../../../../essentials/essentials.module';
import i18nRaw from '../../translation/qw.i18n.json';
import { I18nLoader } from '../../../../../../base/i18n/i18n-loader';
import { ContextPipe } from '../../../../../../base/i18n/context.pipe';

const i18n = I18nLoader.load(i18nRaw);

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'qw-top-bar',
  imports: [
    MatButton,
    MatIcon,
    MatMenu,
    MatMenuItem,
    MatSlider,
    MatSliderThumb,
    FormsModule,
    MatMenuTrigger,
    MatTooltip,
    EssentialsModule,
    ContextPipe,
  ],
  templateUrl: './qw-top-bar.component.html',
  styleUrl: './qw-top-bar.component.scss',
})
export class QwTopBarComponent {
  protected readonly SortType = SortType;
  @Input() session: QuestionWallSession;

  constructor(
    public headerService: HeaderService,
    public readonly self: QuestionWallService,
  ) {}

  protected readonly i18n = i18n;

  get currentOption() {
    return (
      (this.session?.filter.currentSortConfig.type === SortType.Time
        ? this.session?.filter.currentSortConfig.isReverse
          ? 'oldest'
          : 'newest'
        : SortType[
            this.session?.filter.currentSortConfig.type
          ].toLowerCase()) || 'newest'
    );
  }
}
