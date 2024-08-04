import { Component } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatSlider, MatSliderThumb } from '@angular/material/slider';
import { QuestionWallService } from '../../question-wall.service';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'qw-scale-slider',
  standalone: true,
  imports: [MatIcon, MatSlider, MatSliderThumb],
  templateUrl: './qw-scale-slider.component.html',
  styleUrl: './qw-scale-slider.component.scss',
})
export class QwScaleSliderComponent {
  readonly sliderConfig = {
    min: 50,
    max: 400,
    step: 25,
    _default: 100,
  };
  constructor(public readonly self: QuestionWallService) {}
}
