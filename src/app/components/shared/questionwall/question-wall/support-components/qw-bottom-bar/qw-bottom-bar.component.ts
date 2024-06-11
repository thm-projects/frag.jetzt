import { Component, Input } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { FormsModule } from '@angular/forms';
import {
  QuestionWallService,
  QuestionWallSession,
} from '../../question-wall.service';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'qw-bottom-bar',
  standalone: true,
  imports: [MatButton, MatIcon, MatSlideToggle, FormsModule],
  templateUrl: './qw-bottom-bar.component.html',
  styleUrl: './qw-bottom-bar.component.scss',
})
export class QwBottomBarComponent {
  @Input() session: QuestionWallSession;
  constructor(public readonly self: QuestionWallService) {}
}
