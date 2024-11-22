import { Component } from '@angular/core';
import {
  MatCard,
  MatCardActions,
  MatCardContent,
  MatCardFooter,
  MatCardHeader,
  MatCardImage,
  MatCardSmImage,
  MatCardSubtitle,
  MatCardTitle,
  MatCardTitleGroup,
} from '@angular/material/card';
import { NgOptimizedImage } from '@angular/common';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatDivider } from '@angular/material/divider';
import { MatButton } from '@angular/material/button';

@Component({
  selector: 'app-component-test-card',
  imports: [
    MatCardSmImage,
    MatCardSubtitle,
    MatCardTitle,
    MatCardTitleGroup,
    MatCardHeader,
    MatCard,
    MatCardContent,
    NgOptimizedImage,
    MatProgressBar,
    MatCardFooter,
    MatDivider,
    MatCardActions,
    MatButton,
    MatCardImage,
  ],
  templateUrl: './component-test-card.component.html',
  styleUrl: './component-test-card.component.scss',
})
export class ComponentTestCardComponent {
  longText = `The Shiba Inu is the smallest of the six original and distinct spitz breeds of dog
  from Japan. A small, agile dog that copes very well with mountainous terrain, the Shiba Inu was
  originally bred for hunting.`;
}
