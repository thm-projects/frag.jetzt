import { Component, HostBinding, HostListener, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NavigationLabel } from '../navigation-rail/navigation-rail.component';
import { MatIcon } from '@angular/material/icon';
import {
  animate,
  keyframes,
  style,
  transition,
  trigger,
} from '@angular/animations';

@Component({
  selector: 'app-navigation-label',
  standalone: true,
  imports: [MatIcon],
  templateUrl: './navigation-label.component.html',
  styleUrl: './navigation-label.component.scss',
  animations: [
    trigger('openClose', [
      transition('* => *', [
        animate(
          '0.2s',
          keyframes([
            style({ transform: 'scale(0.8)' }),
            style({ transform: 'scale(1)' }),
          ]),
        ),
      ]),
    ]),
  ],
})
export class NavigationLabelComponent {
  @HostBinding('role') _role = 'button';

  @HostBinding('class') get _state() {
    return this.data.state;
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) protected readonly data: NavigationLabel,
  ) {}

  @HostListener('click', ['$event']) _click($event: MouseEvent) {
    this.data.click($event);
  }
}
