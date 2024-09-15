import { Component } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatSlider, MatSliderThumb } from '@angular/material/slider';
import { QuestionWallService } from '../../question-wall.service';
import { DefaultSliderConfig } from '../../qw-config';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'qw-scale-slider',
  standalone: true,
  imports: [MatIcon, MatSlider, MatSliderThumb],
  templateUrl: './qw-scale-slider.component.html',
  styleUrl: './qw-scale-slider.component.scss',
})
export class QwScaleSliderComponent {
  readonly sliderConfig = DefaultSliderConfig;
  constructor(public readonly self: QuestionWallService) {}
}
