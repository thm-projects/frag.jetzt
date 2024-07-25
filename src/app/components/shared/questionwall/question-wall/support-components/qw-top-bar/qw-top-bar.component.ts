import { Component, Input, numberAttribute } from '@angular/core';
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

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'qw-top-bar',
  standalone: true,
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
  ],
  templateUrl: './qw-top-bar.component.html',
  styleUrl: './qw-top-bar.component.scss',
})
export class QwTopBarComponent {
  readonly commentFocusScaleBounds = {
    min: 50,
    max: 400,
    step: 25,
    _default: 100,
  };
  protected readonly SortType = SortType;
  @Input() session: QuestionWallSession;

  constructor(
    public headerService: HeaderService,
    public readonly self: QuestionWallService,
  ) {}

  protected readonly numberAttribute = numberAttribute;
}
