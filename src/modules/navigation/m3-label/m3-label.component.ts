import { CommonModule } from '@angular/common';
import {
  Component,
  HostBinding,
  Injector,
  effect,
  inject,
  input,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-m3-label',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, CommonModule, MatSlideToggleModule],
  templateUrl: './m3-label.component.html',
  styleUrl: './m3-label.component.scss',
})
export class M3LabelComponent {
  active = input(false);
  collapsed = input(false);
  icon = input('unknown_document');
  svgIcon = input('');
  title = input('Button');
  endIcon = input('');
  endSwitch = input<boolean>(undefined);
  smallLabel = input(false);
  @HostBinding('class.collapsed')
  protected hostCollapsed = false;
  private injector = inject(Injector);

  constructor() {
    effect(
      () => {
        this.hostCollapsed = this.collapsed();
      },
      { injector: this.injector },
    );
  }
}
