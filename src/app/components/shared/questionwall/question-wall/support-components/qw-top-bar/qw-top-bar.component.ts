import { Component } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatSlider, MatSliderThumb } from '@angular/material/slider';
import { SortType } from '../../../../../../utils/data-filter-object.lib';
import { HeaderService } from '../../../../../../services/util/header.service';
import { QuestionWallService } from '../../question-wall.service';
import { FormsModule } from '@angular/forms';

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
  ],
  templateUrl: './qw-top-bar.component.html',
  styleUrl: './qw-top-bar.component.scss',
})
export class QwTopBarComponent {
  readonly commentFocusScaleBounds = {
    min: 1,
    max: 5,
    step: 0.1,
  };
  protected readonly SortType = SortType;
  protected currentCommentFocusScale: number = this.commentFocusScaleBounds.min;
  constructor(
    public headerService: HeaderService,
    public readonly self: QuestionWallService,
  ) {}
}
